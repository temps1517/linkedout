import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { canManageCompanies } from "@/lib/rbac";
import { listCompanies, listManagedCompanies } from "@/data/companies";
import { CompanyCreateForm, OpportunityForm } from "@/components/forms/company-forms";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const [companies, managed] = await Promise.all([
    listCompanies(q),
    listManagedCompanies(user),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Corporate partners
        </p>
        <h1 className="mt-2 text-3xl font-bold">Companies</h1>
        <p className="mt-2 text-muted">
          Discover verified organisations, their teams, and current opportunities.
        </p>
      </div>

      <Card>
        <CardContent>
          <form action="/companies" className="flex gap-3">
            <Input name="q" defaultValue={q} placeholder="Search companies, industries, locations…" />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {companies.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <Avatar name={company.name} url={company.logoUrl} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{company.name}</p>
                      {company.verified ? <Badge tone="blue">Verified</Badge> : null}
                    </div>
                    <p className="text-sm text-muted">{company.industry ?? "Organisation"}</p>
                  </div>
                </div>

                <p className="prose-safe mt-4 flex-1 text-sm leading-relaxed text-muted">
                  {company.description ?? "No company description yet."}
                </p>

                <div className="mt-4 space-y-1 text-xs text-muted">
                  {company.location ? (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {company.location}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> {company.members} team member
                    {company.members === 1 ? "" : "s"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> {company.openOpportunities} open opportunity
                    {company.openOpportunities === 1 ? "" : "ies"}
                  </p>
                </div>

                <Link href={`/companies/${company.id}`} className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    View company <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No companies found" description="Try a broader search." />
      )}

      {canManageCompanies(user) ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CompanyCreateForm />
          {managed.length ? <OpportunityForm companies={managed} /> : null}
        </div>
      ) : null}
    </div>
  );
}
