import "server-only";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  email?: boolean;
  emailText?: string;
};

export async function notifyUser(input: NotifyInput) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    },
    include: { user: { select: { email: true, name: true } } },
  });

  if (input.email) {
    await sendEmail({
      to: notification.user.email,
      subject: `LinkedOut: ${input.title}`,
      text:
        input.emailText ??
        `Hi ${notification.user.name},\n\n${input.title}${
          input.body ? `\n\n${input.body}` : ""
        }${input.href ? `\n\nOpen ${input.href}` : ""}`,
    });
  }

  return notification;
}

export async function notifyMany(
  userIds: string[],
  input: Omit<NotifyInput, "userId">,
) {
  const unique = [...new Set(userIds)];
  await Promise.all(unique.map((userId) => notifyUser({ ...input, userId })));
}

export async function trackActivity(
  userId: string,
  type: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, string | number | boolean>,
) {
  await db.activityEvent.create({
    data: {
      userId,
      type,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

export async function writeAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, string | number | boolean>,
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}
