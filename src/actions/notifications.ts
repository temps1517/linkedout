"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function deleteNotificationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.notification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
