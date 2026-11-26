import "server-only";

import { db } from "@/lib/db";

export async function listNotifications(userId: string) {
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  }));
}
