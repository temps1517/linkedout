import "server-only";

import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export async function listPosts(viewer: SessionUser, type?: string) {
  const posts = await db.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(type ? { type } : {}),
      OR: [
        { visibility: "PUBLIC" },
        { authorId: viewer.id },
        { company: { ownerId: viewer.id } },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { id: true, name: true, avatarUrl: true, headline: true } },
        },
      },
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      media: {
        orderBy: { position: "asc" },
        include: { fileAsset: { select: { id: true, name: true, mimeType: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 20,
        include: {
          author: {
            select: {
              name: true,
              profile: { select: { name: true, avatarUrl: true } },
            },
          },
        },
      },
      reactions: { select: { userId: true, type: true } },
      bookmarks: { select: { userId: true } },
      _count: { select: { reactions: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return posts.map((post) => ({
    id: post.id,
    type: post.type,
    body: post.body,
    visibility: post.visibility,
    createdAt: post.createdAt,
    authorName: post.company?.name ?? post.author?.profile?.name ?? post.author?.name ?? "Member",
    authorHeadline: post.author?.profile?.headline ?? null,
    authorAvatar: post.author?.profile?.avatarUrl ?? null,
    authorId: post.author?.id ?? null,
    companyId: post.company?.id ?? null,
    media: post.media.map((item) => ({
      id: item.fileAsset.id,
      name: item.fileAsset.name,
      mimeType: item.fileAsset.mimeType,
      url: `/api/files/${item.fileAsset.id}`,
    })),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorName: comment.author.profile?.name ?? comment.author.name,
    })),
    reactionCount: post._count.reactions,
    commentCount: post._count.comments,
    viewerReaction: post.reactions.find((reaction) => reaction.userId === viewer.id)?.type,
    bookmarked: post.bookmarks.some((bookmark) => bookmark.userId === viewer.id),
  }));
}
