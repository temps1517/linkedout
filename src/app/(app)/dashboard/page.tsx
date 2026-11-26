import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  MailCheck,
  Network,
  Newspaper,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/data/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/types";

const quickActions: Record<Role, { href: string; label: string }[]> = {
  STUDENT: [
    { href: "/profile/me", label: "Complete your profile" },
    { href: "/feed", label: "Share an update" },
    { href: "/opportunities", label: "Explore opportunities" },
  ],
  TRAINER: [
    { href: "/trainer", label: "Review submissions" },
    { href: "/training", label: "Manage programmes" },
    { href: "/feed", label: "Share knowledge" },
  ],
  COMPANY: [
    { href: "/companies", label: "Update company profile" },
    { href: "/opportunities", label: "Post an opportunity" },
    { href: "/people", label: "Discover talent" },
  ],
  ADMIN: [
    { href: "/admin", label: "Review reports" },
    { href: "/admin", label: "Manage users" },
    { href: "/training", label: "View programmes" },
  ],
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; verify?: string; reset?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getDashboardData(user);

  const stats = [
    {
      label: "Connections",
      value: data.counts.connections,
      detail: "Accepted professional connections",
      icon: <Network className="h-5 w-5" />,
    },
    {
      label: "Community posts",
      value: data.counts.posts,
      detail: "Published across the network",
      icon: <Newspaper className="h-5 w-5" />,
    },
    {
      label: "Unread notifications",
      value: data.counts.unreadNotifications,
      detail: "Updates waiting for you",
      icon: <BellRing className="h-5 w-5" />,
    },
    user.role === "TRAINER"
      ? {
          label: "Submissions to review",
          value: data.counts.pendingGrades,
          detail: "Awaiting trainer feedback",
          icon: <GraduationCap className="h-5 w-5" />,
        }
      : user.role === "COMPANY"
        ? {
            label: "Open opportunities",
            value: data.counts.openOpportunities,
            detail: "Live across partner companies",
            icon: <BriefcaseBusiness className="h-5 w-5" />,
          }
        : user.role === "ADMIN"
          ? {
              label: "Open reports",
              value: data.counts.openReports,
              detail: "Items needing moderation",
              icon: <ShieldCheck className="h-5 w-5" />,
            }
          : {
              label: "Applications",
              value: data.counts.applications,
              detail: "Opportunities you applied for",
              icon: <BriefcaseBusiness className="h-5 w-5" />,
            },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Your workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Good to see you, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-muted">
            Here is what is happening across your professional community.
          </p>
        </div>
        <Badge tone="blue" className="capitalize">
          {user.role.toLowerCase()} account
        </Badge>
      </div>

      {params.welcome ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5" />
          Your account is ready. Start by completing your professional profile.
        </div>
      ) : null}
      {params.verify === "success" ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <MailCheck className="h-5 w-5" />
          Your email address has been verified.
        </div>
      ) : null}
      {params.verify === "expired" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          That verification link is invalid or has expired. You can request a new one from your
          profile settings.
        </div>
      ) : null}
      {!user.emailVerifiedAt ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please verify your email address using the link sent when you registered.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your training progress"
            description="Programmes you are enrolled in and where you are up to."
            action={
              <Link href="/training">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
          <CardContent className="space-y-5">
            {data.learnerProgress.length ? (
              data.learnerProgress.map((enrollment) => (
                <div key={enrollment.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{enrollment.cohort.program.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {enrollment.cohort.name} · {enrollment.cohort.program.summary}
                      </p>
                    </div>
                    <Badge tone={enrollment.status === "COMPLETED" ? "green" : "blue"}>
                      {enrollment.status.toLowerCase()}
                    </Badge>
                  </div>
                  <ProgressBar className="mt-4" value={enrollment.progress} label="Progress" />
                </div>
              ))
            ) : (
              <EmptyState
                title="No active training yet"
                description="Browse published programmes and enrol to start tracking your progress."
                action={
                  <Link href="/training">
                    <Button>Browse training</Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Quick actions" description="The next useful step for your role." />
          <CardContent className="space-y-2">
            {quickActions[user.role].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                {action.label}
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" description="Your latest recorded actions." />
          <CardContent className="space-y-3">
            {data.recentActivity.length ? (
              data.recentActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {event.type.toLowerCase().replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No activity recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="From the community" description="Latest published posts." />
          <CardContent className="space-y-3">
            {data.recentPosts.length ? (
              data.recentPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-border p-3">
                  <p className="text-xs font-semibold text-primary">
                    {post.company?.name ?? post.author?.name ?? "Community"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">{post.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No posts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Published programmes"
          value={data.counts.publishedPrograms}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Partner companies"
          value={data.counts.companies}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Your submissions"
          value={data.counts.submissions}
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
