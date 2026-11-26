import {
  AlertTriangle,
  Building2,
  ClipboardList,
  FileCheck2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getAdminStats,
  listAdminCompanies,
  listAdminUsers,
  listAuditLogs,
  listReports,
} from "@/data/admin";
import {
  markUserEmailVerifiedAction,
  resolveReportAction,
  restorePostAction,
  updateUserRoleAction,
} from "@/actions/admin";
import { verifyCompanyAction } from "@/actions/companies";
import { hidePostAction } from "@/actions/feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const [stats, reports, users, companies, logs] = await Promise.all([
    getAdminStats(),
    listReports(),
    listAdminUsers(),
    listAdminCompanies(),
    listAuditLogs(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold">Platform oversight</h1>
        <p className="mt-2 text-muted">
          Moderate content, verify organisations, manage roles, and review audit activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={stats.users} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Open reports" value={stats.openReports} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard
          label="Unverified companies"
          value={stats.unverifiedCompanies}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard label="Published posts" value={stats.posts} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader title="Content reports" description="Review reported posts and take action." />
        <CardContent>
          {reports.length ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{report.reason}</p>
                        <Badge tone={report.status === "OPEN" ? "amber" : "green"}>
                          {report.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Reported by {report.reporterName} · {formatDateTime(report.createdAt)}
                      </p>
                      <p className="prose-safe mt-2 text-sm text-muted">
                        <span className="font-semibold">{report.post.authorName}:</span>{" "}
                        {report.post.body}
                      </p>
                      {report.details ? (
                        <p className="prose-safe mt-2 text-sm text-muted">Details: {report.details}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.status === "OPEN" ? (
                        <>
                          <form action={hidePostAction}>
                            <input type="hidden" name="postId" value={report.post.id} />
                            <Button type="submit" size="sm" variant="danger">
                              Hide post
                            </Button>
                          </form>
                          <form action={resolveReportAction}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="resolution" value="DISMISSED" />
                            <Button type="submit" size="sm" variant="outline">
                              Dismiss
                            </Button>
                          </form>
                          <form action={resolveReportAction}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="resolution" value="RESOLVED" />
                            <Button type="submit" size="sm">
                              Resolve
                            </Button>
                          </form>
                        </>
                      ) : report.post.status === "HIDDEN" ? (
                        <form action={restorePostAction}>
                          <input type="hidden" name="postId" value={report.post.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Restore post
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reports" description="Reported content will appear here." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Members" description={`${users.length} most recent members.`} />
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                      <p className="mt-1 text-xs text-muted">
                        {user.posts} posts · {user.enrollments} enrolments · {user.applications}{" "}
                        applications · {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                    {!user.emailVerified ? (
                      <form action={markUserEmailVerifiedAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Verify email
                        </Button>
                      </form>
                    ) : (
                      <Badge tone="green">
                        <FileCheck2 className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <form action={updateUserRoleAction} className="mt-3 flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Select name="role" defaultValue={user.role} className="h-9 flex-1">
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.toLowerCase()}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" variant="outline">
                      Update
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Companies" description="Verify partner organisations." />
          <CardContent>
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{company.name}</p>
                      {company.verified ? <Badge tone="blue">Verified</Badge> : null}
                    </div>
                    <p className="text-xs text-muted">
                      {company.ownerName} · {company.ownerEmail} · {company.members} members ·{" "}
                      {company.opportunities} opportunities
                    </p>
                  </div>
                  {!company.verified ? (
                    <form action={verifyCompanyAction}>
                      <input type="hidden" name="companyId" value={company.id} />
                      <Button type="submit" size="sm">
                        <ShieldCheck className="h-4 w-4" /> Verify
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Audit log" description="Recent privileged actions." />
        <CardContent>
          {logs.length ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <Badge>{log.action}</Badge>
                  <span className="text-muted">
                    {log.actorName} ({log.actorEmail}) · {log.entityType}
                    {log.entityId ? ` ${log.entityId}` : ""}
                  </span>
                  {log.metadata ? <span className="text-xs text-muted">{log.metadata}</span> : null}
                  <span className="ml-auto text-xs text-muted">{formatDateTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No audit events yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Role guide" />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ROLES.map((role) => (
              <div key={role} className="rounded-xl border border-border p-3">
                <p className="font-bold capitalize">{role.toLowerCase()}</p>
                <p className="mt-1 text-xs text-muted">
                  {
                    {
                      STUDENT: "Learner profile, networking, training, applications.",
                      TRAINER: "Programme builder, cohorts, grading, certificates.",
                      COMPANY: "Company profile, team, opportunities, messaging.",
                      ADMIN: "Moderation, verification, roles, audit oversight.",
                    }[role]
                  }
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
