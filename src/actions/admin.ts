"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import { notifyUser, writeAuditLog } from "@/lib/notifications";
import type { Role } from "@/types";

export async function resolveReportAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const reportId = String(formData.get("reportId") ?? "");
  const resolution = String(formData.get("resolution") ?? "");
  if (!reportId || !["RESOLVED", "DISMISSED"].includes(resolution)) return;

  await db.report.update({
    where: { id: reportId },
    data: {
      status: resolution,
      resolvedById: user.id,
      resolvedAt: new Date(),
    },
  });

  await writeAuditLog(user.id, `REPORT_${resolution}`, "REPORT", reportId);
  revalidatePath("/admin");
}

export async function restorePostAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  await db.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", moderatedById: null },
  });
  await writeAuditLog(user.id, "POST_RESTORED", "POST", postId);
  revalidatePath("/admin");
  revalidatePath("/feed");
}

export async function updateUserRoleAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const targetId = String(formData.get("userId") ?? "");
  const nextRole = String(formData.get("role") ?? "");
  if (!targetId || !ROLES.includes(nextRole as (typeof ROLES)[number])) return;
  if (targetId === user.id && nextRole !== "ADMIN") return;

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, role: true },
  });
  if (!target || target.role === nextRole) return;

  await db.user.update({ where: { id: targetId }, data: { role: nextRole as Role } });
  await notifyUser({
    userId: targetId,
    type: "ROLE",
    title: "Your account role changed",
    body: `Your LinkedOut role is now ${nextRole.toLowerCase()}.`,
    href: "/dashboard",
    email: true,
  });
  await writeAuditLog(user.id, "USER_ROLE_UPDATED", "USER", targetId, {
    from: target.role,
    to: nextRole,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function markUserEmailVerifiedAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const targetId = String(formData.get("userId") ?? "");
  if (!targetId) return;

  await db.user.update({
    where: { id: targetId },
    data: { emailVerifiedAt: new Date() },
  });
  await writeAuditLog(user.id, "USER_EMAIL_VERIFIED", "USER", targetId);
  revalidatePath("/admin");
}
