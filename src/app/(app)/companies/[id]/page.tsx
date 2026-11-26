import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Globe2, Mail, MapPin, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { canManageCompanies } from "@/lib/rbac";
import { getCompany, listManagedCompanies } from "@/data/companies";
import {
  applyToOpportunityAction,
  updateOpportunityStatusAction,
  verifyCompanyAction,
  withdrawApplicationAction,
} from "@/actions/companies";
import { CompanyEditForm, OpportunityForm } from "@/components/forms/company-forms";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Company" };

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [company, managed] = await Promise.all([
    getCompany(id, user),
    canManageCompanies(user) ? listManagedCompanies(user) : Promise.resolve([]),
  ]);
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={company.name} url={company.logoUrl} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                {company.verified ? <Badge tone="blue">Verified</Badge> : null}
              </div>
              <p className="mt-1 text-muted">{company.industry ?? "Organisation"}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                {company.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {company.location}
                  </span>
                ) : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-primary"
                  >
                    <Globe2 className="h-4 w-4" /> Website
                  </a>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> {company.members.length} team members
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/messages?user=${company.ownerId}`}>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4" /> Contact owner
                </Button>
              </Link>
              {user.role === "ADMIN" && !company.verified ? (
                <form action={verifyCompanyAction}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <Button type="submit" size="sm">
                    <CheckCircle2 className="h-4 w-4" /> Verify
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          {company.description ? (
            <p className="prose-safe mt-5 max-w-4xl whitespace-pre-line text-sm leading-relaxed text-muted">
              {company.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Opportunities"
              description={`${company.opportunities.filter((item) => item.status === "OPEN").length} open role${company.opportunities.filter((item) => item.status === "OPEN").length === 1 ? "" : "s"}.`}
            />
            <CardContent>
              {company.opportunities.length ? (
                <div className="space-y-3">
                  {company.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{opportunity.title}</p>
                            <Badge tone={opportunity.status === "OPEN" ? "green" : "neutral"}>
                              {opportunity.status.toLowerCase()}
                            </Badge>
                            <Badge>{opportunity.type.toLowerCase()}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {opportunity.location ?? "Flexible"} · Posted {formatDate(opportunity.createdAt)} ·{" "}
                            {opportunity.applicants} applicant{opportunity.applicants === 1 ? "" : "s"}
                          </p>
                        </div>
                        {company.canEdit ? (
                          <form action={updateOpportunityStatusAction}>
                            <input type="hidden" name="opportunityId" value={opportunity.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={opportunity.status === "OPEN" ? "CLOSED" : "OPEN"}
                            />
                            <Button type="submit" size="sm" variant="outline">
                              {opportunity.status === "OPEN" ? "Close" : "Reopen"}
                            </Button>
                          </form>
                        ) : null}
                      </div>

                      <p className="prose-safe mt-3 text-sm text-muted">{opportunity.description}</p>
                      {opportunity.requirements ? (
                        <p className="prose-safe mt-2 whitespace-pre-line text-sm text-muted">
                          <span className="font-semibold">Requirements:</span> {opportunity.requirements}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {opportunity.applicationUrl ? (
                          <a
                            href={opportunity.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-primary"
                          >
                            External application link
                          </a>
                        ) : null}
                        {!company.canEdit && opportunity.status === "OPEN" ? (
                          opportunity.applied ? (
                            <form action={withdrawApplicationAction}>
                              <input type="hidden" name="opportunityId" value={opportunity.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Withdraw ({opportunity.applicationStatus?.toLowerCase()})
                              </Button>
                            </form>
                          ) : (
                            <form action={applyToOpportunityAction}>
                              <input type="hidden" name="opportunityId" value={opportunity.id} />
                              <Button type="submit" size="sm">
                                Apply
                              </Button>
                            </form>
                          )
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No opportunities yet" description="This company has not posted any roles." />
              )}
            </CardContent>
          </Card>

          {company.canEdit ? (
            <Card>
              <CardHeader title="Edit company profile" />
              <CardContent>
                <CompanyEditForm company={company} />
              </CardContent>
            </Card>
          ) : null}

          {company.canEdit && managed.length ? (
            <OpportunityForm companies={managed} />
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Team" description={company.ownerName ? `Led by ${company.ownerName}.` : undefined} />
            <CardContent className="space-y-3">
              {company.members.length ? (
                company.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.name} url={member.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <p className="text-xs text-muted">{member.headline ?? member.role.toLowerCase()}</p>
                    </div>
                    {member.profileId ? (
                      <Link href={`/profile/${member.profileId}`} className="text-xs font-semibold text-primary">
                        View
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No team members listed.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Community activity" />
            <CardContent>
              <p className="text-sm text-muted">{company.posts} posts published by this company.</p>
              <Link href="/feed" className="mt-3 inline-block text-sm font-semibold text-primary">
                View in community feed
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
