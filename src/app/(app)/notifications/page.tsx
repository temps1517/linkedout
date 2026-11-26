import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/data/notifications";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Stay informed
          </p>
          <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
          <p className="mt-2 text-muted">
            {unread ? `${unread} unread notification${unread === 1 ? "" : "s"}.` : "You are all caught up."}
          </p>
        </div>
        {unread ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length ? (
        <Card>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border p-4 ${
                  notification.readAt ? "border-border bg-white" : "border-blue-200 bg-blue-50/60"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{notification.title}</p>
                      {!notification.readAt ? <Badge tone="blue">New</Badge> : null}
                    </div>
                    {notification.body ? (
                      <p className="prose-safe mt-1 text-sm text-muted">{notification.body}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{formatDateTime(notification.createdAt)}</span>
                      <Badge>{notification.type.toLowerCase()}</Badge>
                      {notification.href ? (
                        <Link href={notification.href} className="font-semibold text-primary">
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.readAt ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <Button type="submit" size="sm" variant="ghost" aria-label="Mark as read">
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteNotificationAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <Button type="submit" size="sm" variant="ghost" aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No notifications"
          description="Activity from your network, training, and applications will appear here."
        />
      )}

      <Card>
        <CardHeader title="Email delivery" description="SMTP settings are read from the server environment." />
        <CardContent>
          <p className="text-sm text-muted">
            Without SMTP credentials, email previews are written to the server console while in-app
            notifications are always saved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
