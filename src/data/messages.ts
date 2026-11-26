import "server-only";

import { db } from "@/lib/db";

export async function listThreads(userId: string) {
  const threads = await db.messageThread.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { include: { profile: { select: { name: true, avatarUrl: true } } } },
      user2: { include: { profile: { select: { name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return threads.map((thread) => {
    const other = thread.user1Id === userId ? thread.user2 : thread.user1;
    return {
      id: thread.id,
      otherUserId: other.id,
      name: other.profile?.name ?? other.name,
      avatarUrl: other.profile?.avatarUrl,
      lastMessage: thread.messages[0]?.body ?? "No messages yet",
      updatedAt: thread.updatedAt,
    };
  });
}

export async function getThread(threadId: string, userId: string) {
  const thread = await db.messageThread.findFirst({
    where: {
      id: threadId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { include: { profile: { select: { name: true, avatarUrl: true } } } },
      user2: { include: { profile: { select: { name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
  });

  if (!thread) return null;

  const other = thread.user1Id === userId ? thread.user2 : thread.user1;

  await db.message.updateMany({
    where: {
      threadId: thread.id,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return {
    id: thread.id,
    otherUserId: other.id,
    name: other.profile?.name ?? other.name,
    avatarUrl: other.profile?.avatarUrl,
    messages: thread.messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      mine: message.senderId === userId,
      senderName: message.sender.name,
    })),
  };
}
