"use client";

import { useActionState } from "react";
import {
  createAssignmentAction,
  createCohortAction,
  createModuleAction,
  createProgramAction,
  createSessionAction,
} from "@/actions/training";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { emptyFormState, type FormState } from "@/types";

type ProgramOption = {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
};

function Result({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
      {state.message}
    </p>
  );
}

export function TrainingAdminForms({ programs }: { programs: ProgramOption[] }) {
  const [programState, programAction, programPending] = useActionState(
    createProgramAction,
    emptyFormState,
  );
  const [cohortState, cohortAction, cohortPending] = useActionState(
    createCohortAction,
    emptyFormState,
  );
  const [moduleState, moduleAction, modulePending] = useActionState(
    createModuleAction,
    emptyFormState,
  );
  const [sessionState, sessionAction, sessionPending] = useActionState(
    createSessionAction,
    emptyFormState,
  );
  const [assignmentState, assignmentAction, assignmentPending] = useActionState(
    createAssignmentAction,
    emptyFormState,
  );

  const allModules = programs.flatMap((program) =>
    program.modules.map((module) => ({ ...module, programTitle: program.title })),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Create programme" description="Creates a draft that you can publish later." />
        <CardContent>
          <form action={programAction} className="space-y-3">
            <Field label="Title" error={programState.fieldErrors?.title?.[0]}>
              <Input name="title" required />
            </Field>
            <Field label="Slug" error={programState.fieldErrors?.slug?.[0]}>
              <Input name="slug" required placeholder="professional-product-engineering" />
            </Field>
            <Field label="Summary" error={programState.fieldErrors?.summary?.[0]}>
              <Textarea name="summary" rows={2} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date">
                <Input name="startDate" placeholder="2026-09-01" />
              </Field>
              <Field label="End date">
                <Input name="endDate" placeholder="2026-12-01" />
              </Field>
            </div>
            <Result state={programState} />
            <Button type="submit" disabled={programPending}>
              {programPending ? "Creating…" : "Create programme"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Create cohort" description="Cohorts hold enrolled learners." />
        <CardContent>
          <form action={cohortAction} className="space-y-3">
            <Field label="Programme">
              <Select name="programId" required defaultValue="">
                <option value="" disabled>
                  Select a programme
                </option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cohort name">
              <Input name="name" required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Start date">
                <Input name="startDate" />
              </Field>
              <Field label="End date">
                <Input name="endDate" />
              </Field>
              <Field label="Capacity">
                <Input name="capacity" type="number" min={1} defaultValue={100} />
              </Field>
            </div>
            <Result state={cohortState} />
            <Button type="submit" disabled={cohortPending}>
              {cohortPending ? "Creating…" : "Create cohort"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Create module" description="Break a programme into learning modules." />
        <CardContent>
          <form action={moduleAction} className="space-y-3">
            <Field label="Programme">
              <Select name="programId" required defaultValue="">
                <option value="" disabled>
                  Select a programme
                </option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Description">
              <Textarea name="description" rows={2} />
            </Field>
            <Field label="Position">
              <Input name="position" type="number" min={0} defaultValue={0} />
            </Field>
            <Result state={moduleState} />
            <Button type="submit" disabled={modulePending}>
              {modulePending ? "Creating…" : "Create module"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Create session & assignment" description="Add learning content and assessed work." />
        <CardContent className="space-y-6">
          <form action={sessionAction} className="space-y-3">
            <Field label="Module">
              <Select name="moduleId" required defaultValue="">
                <option value="" disabled>
                  Select a module
                </option>
                {allModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.programTitle} / {module.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Session title">
              <Input name="title" required />
            </Field>
            <Field label="Content">
              <Textarea name="content" rows={3} placeholder="Lesson notes, prompts, or resources…" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Description">
                <Input name="description" />
              </Field>
              <Field label="Position">
                <Input name="position" type="number" min={0} defaultValue={0} />
              </Field>
            </div>
            <Result state={sessionState} />
            <Button type="submit" size="sm" disabled={sessionPending}>
              Add session
            </Button>
          </form>

          <div className="border-t border-border pt-5">
            <form action={assignmentAction} className="space-y-3">
              <Field label="Module">
                <Select name="moduleId" required defaultValue="">
                  <option value="" disabled>
                    Select a module
                  </option>
                  {allModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.programTitle} / {module.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Assignment title">
                <Input name="title" required />
              </Field>
              <Field label="Brief">
                <Textarea name="description" rows={3} required />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Due date">
                  <Input name="dueAt" placeholder="2026-10-15" />
                </Field>
                <Field label="Max score">
                  <Input name="maxScore" type="number" min={1} defaultValue={100} />
                </Field>
              </div>
              <Result state={assignmentState} />
              <Button type="submit" size="sm" disabled={assignmentPending}>
                Add assignment
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
