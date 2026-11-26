import Link from "next/link";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  ShieldAlert,
  Sparkles,
  Trophy,
  BriefcaseBusiness,
  Lightbulb,
  FileText,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canModerate } from "@/lib/rbac";
import { listPosts } from "@/data/feed";
import {
  addCommentAction,
  hidePostAction,
  reportPostAction,
  toggleBookmarkAction,
  toggleReactionAction,
} from "@/actions/feed";
import { PostComposer } from "@/components/forms/post-composer";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { POST_TYPES, POST_TYPE_LABELS, REACTION_TYPES, REACTION_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Community" };

const typeIcons: Record<string, typeof Sparkles> = {
  UPDATE: Sparkles,
  PROJECT: BriefcaseBusiness,
  ACHIEVEMENT: Trophy,
  OPPORTUNITY: BriefcaseBusiness,
  KNOWLEDGE: Lightbulb,
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const activeType = POST_TYPES.includes(params.type as (typeof POST_TYPES)[number])
    ? params.type
    : undefined;

  const [posts, companies] = await Promise.all([
    listPosts(user, activeType),
    db.company.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
          { owner: { role: "ADMIN" } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Professional community
          </p>
          <h1 className="mt-2 text-3xl font-bold">Community feed</h1>
          <p className="mt-2 text-muted">
            Share work, learning, achievements, opportunities, and useful knowledge.
          </p>
        </div>

        <Card>
          <CardHeader title="Create a post" description="Keep it useful, specific, and professional." />
          <CardContent>
            <PostComposer companies={companies} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/feed">
            <Badge tone={!activeType ? "blue" : "neutral"} className="cursor-pointer">
              All posts
            </Badge>
          </Link>
          {POST_TYPES.map((type) => (
            <Link key={type} href={`/feed?type=${type}`}>
              <Badge tone={activeType === type ? "blue" : "neutral"} className="cursor-pointer">
                {POST_TYPE_LABELS[type]}
              </Badge>
            </Link>
          ))}
        </div>

        {posts.length ? (
          <div className="space-y-5">
            {posts.map((post) => {
              const Icon = typeIcons[post.type] ?? Sparkles;
              return (
                <Card key={post.id}>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={post.authorName} url={post.authorAvatar} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">{post.authorName}</p>
                          <Badge tone="blue">
                            <Icon className="mr-1 h-3 w-3" />
                            {POST_TYPE_LABELS[post.type] ?? post.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted">{post.authorHeadline ?? formatDateTime(post.createdAt)}</p>
                      </div>
                      {canModerate(user) ? (
                        <form action={hidePostAction}>
                          <input type="hidden" name="postId" value={post.id} />
                          <Button type="submit" size="sm" variant="ghost" aria-label="Hide post">
                            <ShieldAlert className="h-4 w-4 text-danger" />
                          </Button>
                        </form>
                      ) : null}
                    </div>

                    <p className="prose-safe text-sm leading-relaxed text-foreground">{post.body}</p>

                    {post.media.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {post.media.map((media) => (
                          <a
                            key={media.id}
                            href={media.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl border border-border bg-slate-50"
                          >
                            {media.mimeType.startsWith("image/") ? (
                              <div
                                className="h-48 w-full bg-cover bg-center"
                                style={{ backgroundImage: `url("${media.url.replace(/["()]/g, "")}")` }}
                                aria-label={media.name}
                                role="img"
                              />
                            ) : (
                              <div className="flex h-24 items-center justify-center gap-2 text-sm font-semibold text-primary">
                                <FileText className="h-5 w-5" /> {media.name}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {REACTION_TYPES.map((type) => (
                        <form key={type} action={toggleReactionAction}>
                          <input type="hidden" name="postId" value={post.id} />
                          <input type="hidden" name="type" value={type} />
                          <Button
                            type="submit"
                            size="sm"
                            variant={post.viewerReaction === type ? "primary" : "ghost"}
                          >
                            <Heart className="h-4 w-4" /> {REACTION_LABELS[type]}
                          </Button>
                        </form>
                      ))}
                      <form action={toggleBookmarkAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant={post.bookmarked ? "secondary" : "ghost"}
                        >
                          <Bookmark className="h-4 w-4" />
                          {post.bookmarked ? "Saved" : "Save"}
                        </Button>
                      </form>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
                        <MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}
                      </span>
                    </div>

                    {post.comments.length ? (
                      <div className="space-y-2 border-t border-border pt-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold">{comment.authorName}</p>
                            <p className="prose-safe mt-1 text-sm text-muted">{comment.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <form action={addCommentAction} className="flex gap-2 border-t border-border pt-3">
                      <input type="hidden" name="postId" value={post.id} />
                      <input
                        name="body"
                        required
                        placeholder="Add a thoughtful comment…"
                        className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                      <Button type="submit" size="md">
                        Comment
                      </Button>
                    </form>

                    <details className="border-t border-border pt-3 text-xs text-muted">
                      <summary className="cursor-pointer">Report this post</summary>
                      <form action={reportPostAction} className="mt-3 space-y-2">
                        <input type="hidden" name="postId" value={post.id} />
                        <input
                          name="reason"
                          required
                          placeholder="Reason"
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm"
                        />
                        <textarea
                          name="details"
                          rows={2}
                          placeholder="Additional details (optional)"
                          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                        />
                        <Button type="submit" size="sm" variant="danger">
                          Submit report
                        </Button>
                      </form>
                    </details>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No posts in this view"
            description="Try another filter, or publish the first post in this category."
          />
        )}
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader title="Community guidelines" />
          <CardContent className="space-y-3 text-sm text-muted">
            <p className="flex gap-2">
              <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Share what you learned, not just what you achieved.
            </p>
            <p className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Be specific. Evidence and context help others learn.
            </p>
            <p className="flex gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Respect privacy. Report content that does not belong here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Your network" description="Connections can see your posts." />
          <CardContent>
            <p className={cn("text-sm text-muted")}>
              Use the People directory to connect with students, trainers, and companies.
            </p>
            <Link href="/people" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Browse people
              </Button>
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
