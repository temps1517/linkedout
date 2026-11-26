import Link from "next/link";
import { FileText, Trash2, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfileForUser, listSkills } from "@/data/profiles";
import {
  DocumentUploadForm,
  ProfileForm,
  ProfileItemForm,
  SkillForm,
} from "@/components/forms/profile-forms";
import { setAvatarAction, setResumeAction, removeProfileItemAction } from "@/actions/profile";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { notFound } from "next/navigation";

export const metadata = { title: "My profile" };

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const [profile, skills, params] = await Promise.all([
    getProfileForUser(user.id),
    listSkills(),
    searchParams,
  ]);

  if (!profile) notFound();

  const sections = [
    profile.headline,
    profile.bio,
    profile.location,
    profile.skills.length,
    profile.qualifications.length,
    profile.projects.length,
    profile.portfolioItems.length,
  ];
  const completeness = Math.round(
    (sections.filter((value) => Boolean(value)).length / sections.length) * 100,
  );

  return (
    <div className="space-y-6">
      {params.saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Profile changes saved.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Professional profile
          </p>
          <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
          <p className="mt-2 text-muted">
            Build a clear, evidence-rich profile that employers and collaborators can understand.
          </p>
        </div>
        <Link href={`/profile/${profile.id}`}>
          <Button variant="outline">View public profile</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar name={profile.name} url={profile.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted">{profile.headline ?? "Add a headline"}</p>
            <div className="mt-3 max-w-md">
              <ProgressBar value={completeness} label="Profile strength" />
            </div>
          </div>
          <div className="grid w-full gap-3 sm:w-auto">
            <DocumentUploadForm
              action={setAvatarAction}
              label="Profile photo"
              accept=".png,.jpg,.jpeg,.webp"
              visibility="PUBLIC"
            />
            <DocumentUploadForm
              action={setResumeAction}
              label="CV or résumé"
              accept=".pdf,.doc,.docx"
              visibility="PRIVATE"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Core details" description="The first thing people will read about you." />
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Skills"
            description="Add the skills you want to be known for and how confident you are."
          />
          <CardContent className="space-y-5">
            <div className="space-y-2">
              {profile.skills.length ? (
                profile.skills.map((profileSkill) => (
                  <div
                    key={profileSkill.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{profileSkill.skill.name}</p>
                      <p className="text-xs text-muted">
                        {profileSkill.level ?? "Level not set"} · {profileSkill.years ?? 0} years
                      </p>
                    </div>
                    <form action={removeProfileItemAction.bind(null, "SKILL", profileSkill.id)}>
                      <Button type="submit" variant="ghost" size="sm" aria-label="Remove skill">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No skills added yet.</p>
              )}
            </div>
            <div className="border-t border-border pt-5">
              <SkillForm skills={skills} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Documents"
            description="Keep your CV available for opportunities while controlling who can read it."
          />
          <CardContent className="space-y-4">
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                <FileText className="h-5 w-5 text-primary" />
                View uploaded CV
              </a>
            ) : (
              <p className="text-sm text-muted">No CV uploaded yet.</p>
            )}
            <div className="rounded-xl border border-border bg-slate-50 p-4 text-sm text-muted">
              Private files are visible to you, administrators, and trainers reviewing a
              submission linked to that file.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Evidence and achievements"
          description="Add projects, qualifications, experience, achievements, and portfolio work."
        />
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Add qualification</summary>
              <div className="mt-4">
                <ProfileItemForm kind="QUALIFICATION" />
              </div>
            </details>
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Add experience</summary>
              <div className="mt-4">
                <ProfileItemForm kind="EXPERIENCE" />
              </div>
            </details>
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Add project</summary>
              <div className="mt-4">
                <ProfileItemForm kind="PROJECT" />
              </div>
            </details>
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Add achievement</summary>
              <div className="mt-4">
                <ProfileItemForm kind="ACHIEVEMENT" />
              </div>
            </details>
            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Add portfolio item</summary>
              <div className="mt-4">
                <ProfileItemForm kind="PORTFOLIO" />
              </div>
            </details>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ItemList
              title="Qualifications"
              items={profile.qualifications.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.institution}${item.year ? ` · ${item.year}` : ""}`,
                url: item.credentialUrl,
              }))}
              kind="QUALIFICATION"
            />
            <ItemList
              title="Experience"
              items={profile.experiences.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.organisation}${item.startDate ? ` · ${item.startDate}` : ""}`,
                description: item.description,
              }))}
              kind="EXPERIENCE"
            />
            <ItemList
              title="Projects"
              items={profile.projects.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: item.tags ?? undefined,
                description: item.description,
                url: item.url,
              }))}
              kind="PROJECT"
            />
            <ItemList
              title="Achievements"
              items={profile.achievements.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: `${item.issuedBy ?? ""}${item.issuedAt ? ` · ${item.issuedAt}` : ""}`,
                description: item.description,
                url: item.url,
              }))}
              kind="ACHIEVEMENT"
            />
            <ItemList
              title="Portfolio"
              items={profile.portfolioItems.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                url: item.url ?? (item.fileAssetId ? `/api/files/${item.fileAssetId}` : undefined),
              }))}
              kind="PORTFOLIO"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ItemList({
  title,
  items,
  kind,
}: {
  title: string;
  items: {
    id: string;
    title: string;
    subtitle?: string;
    description?: string | null;
    url?: string | null;
    secondaryHint?: string | null;
  }[];
  kind: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        <Badge>{items.length}</Badge>
      </div>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.subtitle ? <p className="mt-0.5 text-xs text-muted">{item.subtitle}</p> : null}
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Upload className="h-3 w-3" /> Open link
                    </a>
                  ) : null}
                </div>
                <form action={removeProfileItemAction.bind(null, kind, item.id)}>
                  <Button type="submit" variant="ghost" size="sm" aria-label={`Remove ${item.title}`}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Nothing added yet.</p>
        )}
      </div>
    </div>
  );
}
