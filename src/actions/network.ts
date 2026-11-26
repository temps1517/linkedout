"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notifyUser, trackActivity } from "@/lib/notifications";
import {
  connectionResponseSchema,
  connectionSchema,
  formErrors,
  messageSchema,
  newThreadSchema,
} from "@/lib/validation";
import type { FormState } from "@/types";

export async function sendConnectionAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = connectionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const { addresseeId, message } = parsed.data;

  if (addresseeId === user.id) {
    return { status: "error", message: "You cannot connect with yourself." };
  }

  const target = await db.user.findUnique({
    where: { id: addresseeId },
    select: { id: true, name: true },
  });
  if (!target) return { status: "error", message: "That member was not found." };

  const existing = await db.connection.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: user.id },
      ],
    },
  });

  if (existing?.status === "ACCEPTED") {
    return { status: "success", message: "You are already connected." };
  }

  if (existing?.status === "PENDING" && existing.requesterId === user.id) {
    return { status: "success", message: "Your request is already pending." };
  }

  if (existing) {
    await db.connection.update({
      where: { id: existing.id },
      data: { status: "PENDING", message, requesterId: user.id, addresseeId },
    });
  } else {
    await db.connection.create({
      data: { requesterId: user.id, addresseeId, message, status: "PENDING" },
    });
  }

  await notifyUser({
    userId: addresseeId,
    type: "CONNECTION",
    title: `${user.name} wants to connect`,
    body: message,
    href: "/people",
    email: true,
  });
  await trackActivity(user.id, "CONNECTION_REQUESTED", "USER", addresseeId);

  revalidatePath("/people");
  return { status: "success", message: `Connection request sent to ${target.name}.` };
}

export async function respondConnectionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = connectionResponseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const connection = await db.connection.findFirst({
    where: {
      id: parsed.data.connectionId,
      addresseeId: user.id,
      status: "PENDING",
    },
    include: { requester: { select: { name: true } } },
  });

  if (!connection) return;

  await db.connection.update({
    where: { id: connection.id },
    data: { status: parsed.data.response },
  });

  if (parsed.data.response === "ACCEPTED") {
    const [user1Id, user2Id] = [connection.requesterId, user.id].sort();
    await db.messageThread.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      create: { user1Id, user2Id },
      update: {},
    });
  }

  await notifyUser({
    userId: connection.requesterId,
    type: "CONNECTION",
    title: `${user.name} ${parsed.data.response.toLowerCase()} your connection request`,
    href: "/people",
  });
  await trackActivity(user.id, "CONNECTION_RESPONDED", "CONNECTION", connection.id);

  revalidatePath("/people");
  revalidatePath("/messages");
}

export async function startThreadAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = newThreadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const { otherUserId, body, companyId } = parsed.data;

  if (otherUserId === user.id) {
    return { status: "error", message: "You cannot message yourself." };
  }

  const target = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true },
  });
  if (!target) return { status: "error", message: "That member was not found." };

  const [user1Id, user2Id] = [user.id, otherUserId].sort();
  const thread = await db.messageThread.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    create: { user1Id, user2Id, companyId },
    update: companyId ? { companyId } : {},
  });

  await db.message.create({
    data: { threadId: thread.id, senderId: user.id, body },
  });
  await db.messageThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });
  await notifyUser({
    userId: otherUserId,
    type: "MESSAGE",
    title: `New message from ${user.name}`,
    body,
    href: `/messages?thread=${thread.id}`,
    email: true,
  });
  await trackActivity(user.id, "MESSAGE_SENT", "THREAD", thread.id);

  redirect(`/messages?thread=${thread.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const thread = await db.messageThread.findFirst({
    where: {
      id: parsed.data.threadId,
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
  });
  if (!thread) return;

  await db.message.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body: parsed.data.body,
    },
  });
  await db.messageThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  const otherUserId = thread.user1Id === user.id ? thread.user2Id : thread.user1Id;
  await notifyUser({
    userId: otherUserId,
    type: "MESSAGE",
    title: `New message from ${user.name}`,
    body: parsed.data.body,
    href: `/messages?thread=${thread.id}`,
  });
  await trackActivity(user.id, "MESSAGE_SENT", "THREAD", thread.id);

  revalidatePath(`/messages?thread=${thread.id}`);
}
