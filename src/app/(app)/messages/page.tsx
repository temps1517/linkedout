import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getThread, listThreads } from "@/data/messages";
import { sendMessageAction } from "@/actions/network";
import { StartThreadForm } from "@/components/forms/connection-controls";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; user?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const [threads, thread] = await Promise.all([
    listThreads(user.id),
    params.thread ? getThread(params.thread, user.id) : Promise.resolve(null),
  ]);

  const newRecipient = params.user
    ? await db.user.findUnique({
        where: { id: params.user },
        select: { id: true, name: true, profile: { select: { name: true, avatarUrl: true } } },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Direct conversations
        </p>
        <h1 className="mt-2 text-3xl font-bold">Messages</h1>
        <p className="mt-2 text-muted">
          Speak directly with members and company representatives.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Conversations" description={`${threads.length} thread${threads.length === 1 ? "" : "s"}.`} />
          <CardContent className="space-y-2">
            {threads.length ? (
              threads.map((item) => (
                <Link
                  key={item.id}
                  href={`/messages?thread=${item.id}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    params.thread === item.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={item.name} url={item.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-xs text-muted">{item.lastMessage}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">No conversations yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={thread ? thread.name : newRecipient ? newRecipient.profile?.name ?? newRecipient.name : "Start a conversation"}
            description={
              thread
                ? "Messages are private to you and the other person."
                : "Choose a conversation or start a new one."
            }
          />
          <CardContent>
            {thread ? (
              <div className="space-y-4">
                <div className="max-h-[480px] space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
                  {thread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        message.mine
                          ? "ml-auto bg-primary text-white"
                          : "bg-white text-foreground shadow-sm"
                      }`}
                    >
                      <p className="prose-safe">{message.body}</p>
                      <p className={`mt-1 text-[10px] ${message.mine ? "text-blue-100" : "text-muted"}`}>
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <form action={sendMessageAction} className="flex items-end gap-2">
                  <input type="hidden" name="threadId" value={thread.id} />
                  <textarea
                    name="body"
                    rows={2}
                    required
                    placeholder={`Message ${thread.name}…`}
                    className="min-h-11 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <Button type="submit">
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </form>
              </div>
            ) : newRecipient ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Avatar
                    name={newRecipient.profile?.name ?? newRecipient.name}
                    url={newRecipient.profile?.avatarUrl}
                    size="lg"
                  />
                  <div>
                    <p className="font-bold">{newRecipient.profile?.name ?? newRecipient.name}</p>
                    <p className="text-sm text-muted">
                      {newRecipient.profile ? "Send your first message." : "Member"}
                    </p>
                  </div>
                </div>
                <StartThreadForm otherUserId={newRecipient.id} />
              </div>
            ) : (
              <EmptyState
                title="No conversation selected"
                description="Pick an existing conversation from the list, or message someone from the people directory."
                action={
                  <Link href="/people">
                    <Button>
                      <MessageSquare className="h-4 w-4" /> Find people
                    </Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
