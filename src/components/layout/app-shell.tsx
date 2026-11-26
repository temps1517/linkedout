import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, Search } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export async function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const unreadCount = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">LinkedOut</span>
          </Link>

          <form action="/people" className="relative ml-auto hidden w-full max-w-sm md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              aria-label="Search people"
              placeholder="Search people, skills, companies…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </form>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <Link href="/profile/me" className="flex items-center gap-2">
              <Avatar name={user.profile?.name ?? user.name} url={user.profile?.avatarUrl} size="sm" />
              <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-surface p-3">
            <NavLinks role={user.role} />
          </div>
          <p className="mt-4 px-3 text-xs leading-relaxed text-muted">
            Signed in as <span className="font-semibold">{user.role.toLowerCase()}</span>
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
          </p>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
