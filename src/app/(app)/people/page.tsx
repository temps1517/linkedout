import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  listConnections,
  listPendingConnections,
  listPeople,
} from "@/data/profiles";
import { respondConnectionAction } from "@/actions/network";
import { ConnectButton } from "@/components/forms/connection-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { ROLES } from "@/lib/constants";
import type { Role } from "@/types";

export const metadata = { title: "People" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; skill?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const role = ROLES.includes(params.role as (typeof ROLES)[number])
    ? (params.role as Role)
    : undefined;

  const [people, pending, connections] = await Promise.all([
    listPeople({ viewer: user, q: params.q, role, skill: params.skill }),
    listPendingConnections(user.id),
    listConnections(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Professional network
        </p>
        <h1 className="mt-2 text-3xl font-bold">People</h1>
        <p className="mt-2 text-muted">
          Find students, trainers, and company partners to learn from and work with.
        </p>
      </div>

      {pending.length ? (
        <Card>
          <CardHeader
            title="Connection requests"
            description={`${pending.length} request${pending.length === 1 ? "" : "s"} waiting for you.`}
          />
          <CardContent className="space-y-3">
            {pending.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
              >
                <Avatar
                  name={request.requester.profile?.name ?? request.requester.name}
                  url={request.requester.profile?.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {request.requester.profile?.name ?? request.requester.name}
                  </p>
                  <p className="text-sm text-muted">{request.message ?? "Wants to connect."}</p>
                </div>
                <form action={respondConnectionAction} className="flex gap-2">
                  <input type="hidden" name="connectionId" value={request.id} />
                  <Button type="submit" name="response" value="ACCEPTED" size="sm">
                    Accept
                  </Button>
                  <Button type="submit" name="response" value="DECLINED" size="sm" variant="outline">
                    Decline
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Directory" description="Search by name, role, skill, or location." />
        <CardContent>
          <form action="/people" className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
            <Input name="q" defaultValue={params.q} placeholder="Name, headline, location…" />
            <Select name="role" defaultValue={params.role ?? ""}>
              <option value="">All roles</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item.toLowerCase()}
                </option>
              ))}
            </Select>
            <Input name="skill" defaultValue={params.skill} placeholder="Skill" />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {people.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <Card key={person.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={person.profile?.name ?? person.name}
                    url={person.profile?.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="font-bold">{person.profile?.name ?? person.name}</p>
                    <p className="text-sm text-muted">{person.profile?.headline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="blue" className="capitalize">
                        {person.role.toLowerCase()}
                      </Badge>
                      {person.profile?.location ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3 w-3" /> {person.profile.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {person.profile?.skills.slice(0, 4).map((profileSkill) => (
                    <Badge key={profileSkill.id}>{profileSkill.skill.name}</Badge>
                  ))}
                </div>

                {person.profile?.openToOpportunities ? (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <Building2 className="h-3.5 w-3.5" /> Open to opportunities
                  </p>
                ) : null}

                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <ConnectButton userId={person.id} status={person.connectionStatus as never} />
                  <Link href={`/profile/${person.profile?.id ?? ""}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No members found"
          description="Try a broader search or remove one of the filters."
        />
      )}

      <Card>
        <CardHeader
          title="Your connections"
          description={`${connections.length} accepted connection${connections.length === 1 ? "" : "s"}.`}
        />
        <CardContent className="space-y-2">
          {connections.length ? (
            connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <Avatar name={connection.name} url={connection.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{connection.name}</p>
                  <p className="text-xs text-muted">{connection.headline}</p>
                </div>
                <Link href={`/messages?user=${connection.userId}`}>
                  <Button variant="ghost" size="sm">
                    Message
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No accepted connections yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
