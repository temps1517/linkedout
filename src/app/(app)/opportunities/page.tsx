import Link from "next/link";
import { BriefcaseBusiness, MapPin, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listOpportunities } from "@/data/companies";
import {
  applyToOpportunityAction,
  withdrawApplicationAction,
} from "@/actions/companies";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; location?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const opportunities = await listOpportunities(user, params);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Career opportunities
        </p>
        <h1 className="mt-2 text-3xl font-bold">Opportunities</h1>
        <p className="mt-2 text-muted">
          Roles, internships, projects, and mentorships shared by verified partners.
        </p>
      </div>

      <Card>
        <CardContent>
          <form action="/opportunities" className="grid gap-3 sm:grid-cols-[1fr_170px_170px_auto]">
            <Input name="q" defaultValue={params.q} placeholder="Role, company, keyword…" />
            <Select name="type" defaultValue={params.type ?? ""}>
              <option value="">All types</option>
              {OPPORTUNITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </Select>
            <Input name="location" defaultValue={params.location} placeholder="Location" />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {opportunities.length ? (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar name={opportunity.company.name} url={opportunity.company.logoUrl} size="lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{opportunity.title}</h2>
                        <Badge tone={opportunity.company.verified ? "blue" : "neutral"}>
                          {opportunity.type.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
                        <Link href={`/companies/${opportunity.company.id}`} className="font-semibold text-primary">
                          {opportunity.company.name}
                        </Link>
                        {opportunity.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {opportunity.location}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> {opportunity.applicants} applicant
                          {opportunity.applicants === 1 ? "" : "s"}
                        </span>
                        <span>{formatDate(opportunity.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opportunity.applicationUrl ? (
                      <a
                        href={opportunity.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-slate-50"
                      >
                        External link
                      </a>
                    ) : null}
                    {opportunity.applied ? (
                      <form action={withdrawApplicationAction}>
                        <input type="hidden" name="opportunityId" value={opportunity.id} />
                        <Button type="submit" variant="outline">
                          Withdraw ({opportunity.applicationStatus?.toLowerCase()})
                        </Button>
                      </form>
                    ) : (
                      <form action={applyToOpportunityAction}>
                        <input type="hidden" name="opportunityId" value={opportunity.id} />
                        <Button type="submit">Apply now</Button>
                      </form>
                    )}
                  </div>
                </div>

                <p className="prose-safe mt-4 text-sm leading-relaxed text-muted">{opportunity.description}</p>
                {opportunity.requirements ? (
                  <p className="prose-safe mt-2 whitespace-pre-line text-sm text-muted">
                    <span className="font-semibold">Requirements:</span> {opportunity.requirements}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No open opportunities"
          description="Try different filters, or check back when partners publish new roles."
          action={<BriefcaseBusiness className="h-8 w-8 text-muted" />}
        />
      )}
    </div>
  );
}
