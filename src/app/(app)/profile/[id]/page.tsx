import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, Link2, MapPin, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfileById } from "@/data/profiles";
import { endorseSkillAction } from "@/actions/profile";
import { respondConnectionAction } from "@/actions/network";
import { ConnectButton, StartThreadForm } from "@/components/forms/connection-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const profile = await getProfileById(id, user);

  if (!profile || profile.visibility === "PRIVATE") {
    notFound();
  }

  const isOwn = profile.userId === user.id;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-teal-600" />
        <CardContent className="-mt-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-end gap-4">
              <Avatar
                name={profile.name}
                url={profile.avatarUrl}
                size="xl"
                className="ring-4 ring-white"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  {profile.user.role === "COMPANY" ? (
                    <Badge tone="teal">Company partner</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{profile.headline ?? "Professional member"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {profile.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  ) : null}
                  {profile.availability ? (
                    <Badge tone="green">{profile.availability}</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            {!isOwn ? (
              <div className="space-y-3">
                <ConnectButton userId={profile.userId} status={profile.connectionStatus} />
                {profile.connectionStatus === "PENDING_RECEIVED" && profile.connectionId ? (
                  <form action={respondConnectionAction} className="flex gap-2">
                    <input type="hidden" name="connectionId" value={profile.connectionId} />
                    <Button type="submit" name="response" value="ACCEPTED" size="sm">
                      Accept
                    </Button>
                    <Button type="submit" name="response" value="DECLINED" size="sm" variant="outline">
                      Decline
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : (
              <Link href="/profile/me">
                <Button variant="outline">Edit profile</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="About" />
            <CardContent>
              <p className="prose-safe text-sm leading-relaxed text-muted">
                {profile.bio ?? "This member has not added an about section yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Skills" description="Endorsed by other members of the community." />
            <CardContent className="flex flex-wrap gap-2">
              {profile.skills.length ? (
                profile.skills.map((profileSkill) => (
                  <div
                    key={profileSkill.id}
                    className="rounded-xl border border-border bg-slate-50 px-3 py-2"
                  >
                    <p className="text-sm font-semibold">{profileSkill.skill.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {profileSkill.level ?? "Not specified"} ·{" "}
                      {profileSkill.endorsements.length} endorsement
                      {profileSkill.endorsements.length === 1 ? "" : "s"}
                    </p>
                    {!isOwn ? (
                      <form action={endorseSkillAction.bind(null, profileSkill.id)} className="mt-2">
                        <Button type="submit" size="sm" variant="outline">
                          Endorse
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Projects and portfolio" />
            <CardContent className="space-y-3">
              {profile.projects.length || profile.portfolioItems.length ? (
                <>
                  {profile.projects.map((project) => (
                    <div key={project.id} className="rounded-xl border border-border p-4">
                      <p className="font-semibold">{project.title}</p>
                      {project.tags ? (
                        <p className="mt-1 text-xs text-muted">{project.tags}</p>
                      ) : null}
                      <p className="prose-safe mt-2 text-sm text-muted">{project.description}</p>
                      {project.url ? (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          <Link2 className="h-4 w-4" /> View project
                        </a>
                      ) : null}
                    </div>
                  ))}
                  {profile.portfolioItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-4">
                      <p className="font-semibold">{item.title}</p>
                      <p className="prose-safe mt-2 text-sm text-muted">{item.description}</p>
                      {item.url || item.fileAssetId ? (
                        <a
                          href={item.url ?? `/api/files/${item.fileAssetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          <Link2 className="h-4 w-4" /> Open work sample
                        </a>
                      ) : null}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted">No portfolio work added yet.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Qualifications" />
              <CardContent className="space-y-3">
                {profile.qualifications.length ? (
                  profile.qualifications.map((item) => (
                    <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.institution}
                        {item.year ? ` · ${item.year}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No qualifications listed.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Achievements" />
              <CardContent className="space-y-3">
                {profile.achievements.length ? (
                  profile.achievements.map((item) => (
                    <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Trophy className="h-4 w-4 text-amber-600" /> {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {item.issuedBy ?? "Issued"}
                        {item.issuedAt ? ` · ${item.issuedAt}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No achievements listed.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader title="Experience" />
            <CardContent className="space-y-3">
              {profile.experiences.length ? (
                profile.experiences.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.organisation}
                      {item.startDate ? ` · ${item.startDate}` : ""}
                      {item.endDate ? ` to ${item.endDate}` : ""}
                    </p>
                    <p className="prose-safe mt-2 text-sm text-muted">{item.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No experience listed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Connect and collaborate" />
            <CardContent className="space-y-4">
              {isOwn ? (
                <p className="text-sm text-muted">
                  This is your public profile. Use the edit page to update it.
                </p>
              ) : (
                <StartThreadForm otherUserId={profile.userId} />
              )}
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-muted">
                <BadgeCheck className="mb-2 h-5 w-5 text-primary" />
                Profiles focus on verifiable work, learning, and contribution.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Profile details" />
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Role</span>
                <span className="font-semibold capitalize">{profile.user.role.toLowerCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Location</span>
                <span className="font-semibold">{profile.location ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Availability</span>
                <span className="font-semibold">{profile.availability ?? "—"}</span>
              </div>
              {profile.linkedinUrl ? (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-semibold text-primary hover:underline"
                >
                  <BriefcaseBusiness className="h-4 w-4" /> LinkedIn
                </a>
              ) : null}
              {profile.githubUrl ? (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-semibold text-primary hover:underline"
                >
                  <Link2 className="h-4 w-4" /> GitHub
                </a>
              ) : null}
              {profile.portfolioUrl ? (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-semibold text-primary hover:underline"
                >
                  <Link2 className="h-4 w-4" /> Portfolio
                </a>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
