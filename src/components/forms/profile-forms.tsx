"use client";

import { useActionState, useState } from "react";
import { addProfileItemAction, addSkillAction, updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { UploadField } from "@/components/forms/upload-field";
import { PROFILE_VISIBILITY, SKILL_LEVELS } from "@/lib/constants";
import { emptyFormState } from "@/types";

type ProfileValues = {
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  visibility: string;
  openToOpportunities: boolean;
};

export function ProfileForm({
  profile,
}: {
  profile: ProfileValues;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={state.fieldErrors?.name?.[0]}>
          <Input name="name" defaultValue={profile.name} required />
        </Field>
        <Field label="Headline" error={state.fieldErrors?.headline?.[0]}>
          <Input
            name="headline"
            defaultValue={profile.headline ?? ""}
            placeholder="e.g. Final-year software engineering student"
          />
        </Field>
        <Field label="Location" error={state.fieldErrors?.location?.[0]}>
          <Input name="location" defaultValue={profile.location ?? ""} />
        </Field>
        <Field label="Availability" error={state.fieldErrors?.availability?.[0]}>
          <Input name="availability" defaultValue={profile.availability ?? ""} />
        </Field>
      </div>

      <Field label="About" error={state.fieldErrors?.bio?.[0]}>
        <Textarea name="bio" defaultValue={profile.bio ?? ""} rows={5} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="LinkedIn" error={state.fieldErrors?.linkedinUrl?.[0]}>
          <Input name="linkedinUrl" defaultValue={profile.linkedinUrl ?? ""} placeholder="https://…" />
        </Field>
        <Field label="GitHub" error={state.fieldErrors?.githubUrl?.[0]}>
          <Input name="githubUrl" defaultValue={profile.githubUrl ?? ""} placeholder="https://…" />
        </Field>
        <Field label="Portfolio" error={state.fieldErrors?.portfolioUrl?.[0]}>
          <Input name="portfolioUrl" defaultValue={profile.portfolioUrl ?? ""} placeholder="https://…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Profile visibility">
          <Select name="visibility" defaultValue={profile.visibility}>
            {PROFILE_VISIBILITY.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-end gap-3 pb-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="openToOpportunities"
            value="true"
            defaultChecked={profile.openToOpportunities}
            className="h-4 w-4 accent-blue-700"
          />
          Open to opportunities
        </label>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function SkillForm({ skills }: { skills: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addSkillAction, emptyFormState);
  const [mode, setMode] = useState("new");

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Add a skill">
        <Select name="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="new">New skill</option>
          <option value="existing">Choose an existing skill</option>
        </Select>
      </Field>

      {mode === "new" ? (
        <Field label="Skill name" error={state.fieldErrors?.name?.[0]}>
          <Input name="name" placeholder="e.g. Data analysis" required />
        </Field>
      ) : (
        <Field label="Skill" error={state.fieldErrors?.skillId?.[0]}>
          <Select name="skillId" required>
            <option value="">Select a skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Level" error={state.fieldErrors?.level?.[0]}>
          <Select name="level" defaultValue="Developing">
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Years" error={state.fieldErrors?.years?.[0]}>
          <Input name="years" type="number" min="0" max="60" defaultValue="0" />
        </Field>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add skill"}
      </Button>
    </form>
  );
}

const itemConfig: Record<
  string,
  { title: string; secondaryLabel: string; dateLabel: string; urlLabel: string; upload?: boolean }
> = {
  QUALIFICATION: {
    title: "Add qualification",
    secondaryLabel: "Institution",
    dateLabel: "Graduation year",
    urlLabel: "Credential URL",
  },
  EXPERIENCE: {
    title: "Add experience",
    secondaryLabel: "Organisation",
    dateLabel: "Start date",
    urlLabel: "Link (optional)",
  },
  PROJECT: {
    title: "Add project",
    secondaryLabel: "Tags",
    dateLabel: "Start date",
    urlLabel: "Project URL",
  },
  ACHIEVEMENT: {
    title: "Add achievement",
    secondaryLabel: "Issued by",
    dateLabel: "Date",
    urlLabel: "Link (optional)",
  },
  PORTFOLIO: {
    title: "Add portfolio item",
    secondaryLabel: "Category",
    dateLabel: "Date",
    urlLabel: "Link URL",
    upload: true,
  },
};

export function ProfileItemForm({ kind }: { kind: keyof typeof itemConfig }) {
  const [state, formAction, pending] = useActionState(addProfileItemAction, emptyFormState);
  const config = itemConfig[kind];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <Field label="Title" error={state.fieldErrors?.title?.[0]}>
        <Input name="title" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={config.secondaryLabel}>
          <Input name="secondary" />
        </Field>
        <Field label={config.dateLabel}>
          <Input name="date" placeholder={kind === "QUALIFICATION" ? "2026" : "YYYY-MM"} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={3} />
      </Field>
      <Field label={config.urlLabel} error={state.fieldErrors?.url?.[0]}>
        <Input name="url" placeholder="https://…" />
      </Field>
      {config.upload ? (
        <UploadField
          name="fileAssetId"
          label="Upload a work sample"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp4"
          visibility="PUBLIC"
        />
      ) : null}
      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : config.title}
      </Button>
    </form>
  );
}

export function DocumentUploadForm({
  action,
  label,
  accept,
  visibility,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  accept: string;
  visibility: "PUBLIC" | "PRIVATE";
}) {
  return (
    <form action={action} className="space-y-3">
      <UploadField name="fileAssetId" label={label} accept={accept} visibility={visibility} />
      <Button type="submit" size="sm" variant="outline">
        Save document
      </Button>
    </form>
  );
}
