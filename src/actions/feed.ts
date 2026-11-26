"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canModerate } from "@/lib/rbac";
import { notifyMany, notifyUser, trackActivity, writeAuditLog } from "@/lib/notifications";
import {
  commentSchema,
  formErrors,
  postSchema,
  reportSchema,
  reactionSchema,
} from "@/lib/validation";
import type { FormState } from "@/types";

export async function createPostAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries()) as Record<string, unknown>;
  raw.mediaIds = formData.getAll("mediaIds").filter(Boolean);
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const { body, type, visibility, companyId, mediaIds } = parsed.data;

  if (companyId) {
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { members: { where: { userId: user.id } } },
    });
    if (
      !company ||
      (company.ownerId !== user.id && company.members.length === 0 && user.role !== "ADMIN")
    ) {
      return { status: "error", message: "You cannot post on behalf of that company." };
    }
  }

  if (mediaIds.length) {
    const owned = await db.fileAsset.count({
      where: { id: { in: mediaIds }, ownerId: user.id },
    });
    if (owned !== new Set(mediaIds).size) {
      return { status: "error", message: "One or more uploaded files could not be used." };
    }
    await db.fileAsset.updateMany({
      where: { id: { in: mediaIds } },
      data: { visibility: "PUBLIC" },
    });
  }

  const post = await db.post.create({
    data: {
      authorId: user.id,
      companyId,
      type,
      body,
      visibility,
      media: {
        create: mediaIds.map((fileAssetId, position) => ({ fileAssetId, position })),
      },
    },
    select: { id: true },
  });

  const connections = await db.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  await notifyMany(
    connections.map((connection) =>
      connection.requesterId === user.id ? connection.addresseeId : connection.requesterId,
    ),
    {
      type: "POST",
      title: `${user.name} shared a ${type.toLowerCase()}`,
      body: body.slice(0, 180),
      href: "/feed",
    },
  );
  await trackActivity(user.id, "POST_CREATED", "POST", post.id);

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  return { status: "success", message: "Post published." };
}

export async function toggleReactionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { postId, type } = parsed.data;
  const existing = await db.reaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing?.type === type) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await db.reaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await db.reaction.create({ data: { postId, userId: user.id, type } });
  }

  revalidatePath("/feed");
}

export async function toggleBookmarkAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const existing = await db.bookmark.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
  } else {
    await db.bookmark.create({ data: { postId, userId: user.id } });
  }

  revalidatePath("/feed");
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { postId, body } = parsed.data;
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) return;

  await db.comment.create({ data: { postId, authorId: user.id, body } });
  await trackActivity(user.id, "COMMENT_CREATED", "POST", postId);

  if (post.authorId && post.authorId !== user.id) {
    await notifyUser({
      userId: post.authorId,
      type: "COMMENT",
      title: `${user.name} commented on your post`,
      body,
      href: "/feed",
    });
  }

  revalidatePath("/feed");
}

export async function reportPostAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await db.report.create({
    data: {
      postId: parsed.data.postId,
      reporterId: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await notifyMany(
    admins.map((admin) => admin.id),
    {
      type: "REPORT",
      title: "A post was reported",
      body: parsed.data.reason,
      href: "/admin",
    },
  );

  revalidatePath("/admin");
}

export async function hidePostAction(formData: FormData) {
  const user = await requireUser();
  if (!canModerate(user)) return;

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  await db.post.update({
    where: { id: postId },
    data: { status: "HIDDEN", moderatedById: user.id },
  });
  await writeAuditLog(user.id, "POST_HIDDEN", "POST", postId);

  revalidatePath("/feed");
  revalidatePath("/admin");
}
