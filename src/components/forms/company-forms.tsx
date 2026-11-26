"use client";

import { useActionState } from "react";
import {
  createCompanyAction,
  createOpportunityAction,
  updateCompanyAction,
} from "@/actions/companies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { emptyFormState } from "@/types";

type CompanyOption = { id: string; name: string };

type EditableCompany = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  description: string | null;
};

function Result({ message, error }: { message?: string; error?: boolean }) {
  if (!message) return null;
  return <p className={`text-sm ${error ? "text-danger" : "text-success"}`}>{message}</p>;
}

export function CompanyCreateForm() {
  const [state, formAction, pending] = useActionState(createCompanyAction, emptyFormState);

  return (
    <Card>
      <CardHeader title="Add your company" description="Company accounts and admins can create a profile." />
      <CardContent>
        <form action={formAction} className="space-y-3">
          <Field label="Company name" error={state.fieldErrors?.name?.[0]}>
            <Input name="name" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Website" error={state.fieldErrors?.website?.[0]}>
              <Input name="website" placeholder="https://example.com" />
            </Field>
            <Field label="Industry">
              <Input name="industry" />
            </Field>
          </div>
          <Field label="Location">
            <Input name="location" />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={3} />
          </Field>
          <Result message={state.message} error={state.status === "error"} />
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create company profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CompanyEditForm({ company }: { company: EditableCompany }) {
  const [state, formAction, pending] = useActionState(updateCompanyAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="companyId" value={company.id} />
      <Field label="Company name" error={state.fieldErrors?.name?.[0]}>
        <Input name="name" defaultValue={company.name} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Website" error={state.fieldErrors?.website?.[0]}>
          <Input name="website" defaultValue={company.website ?? ""} />
        </Field>
        <Field label="Industry">
          <Input name="industry" defaultValue={company.industry ?? ""} />
        </Field>
      </div>
      <Field label="Location">
        <Input name="location" defaultValue={company.location ?? ""} />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={4} defaultValue={company.description ?? ""} />
      </Field>
      <Result message={state.message} error={state.status === "error"} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save company profile"}
      </Button>
    </form>
  );
}

export function OpportunityForm({ companies }: { companies: CompanyOption[] }) {
  const [state, formAction, pending] = useActionState(createOpportunityAction, emptyFormState);

  return (
    <Card>
      <CardHeader title="Post an opportunity" description="Jobs, internships, projects, and mentorships." />
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company">
              <Select name="companyId" required defaultValue="">
                <option value="" disabled>
                  Select a company
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue="JOB">
                {OPPORTUNITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Title" error={state.fieldErrors?.title?.[0]}>
            <Input name="title" required />
          </Field>
          <Field label="Location">
            <Input name="location" />
          </Field>
          <Field label="Description" error={state.fieldErrors?.description?.[0]}>
            <Textarea name="description" rows={3} required />
          </Field>
          <Field label="Requirements">
            <Textarea name="requirements" rows={3} />
          </Field>
          <Field label="External application URL" error={state.fieldErrors?.applicationUrl?.[0]}>
            <Input name="applicationUrl" placeholder="https://… (optional)" />
          </Field>
          <Result message={state.message} error={state.status === "error"} />
          <Button type="submit" disabled={pending}>
            {pending ? "Publishing…" : "Publish opportunity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
