"use client";

import { useActionState } from "react";
import { gradeSubmissionAction } from "@/actions/training";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { emptyFormState } from "@/types";

export function GradeForm({
  submissionId,
  maxScore,
}: {
  submissionId: string;
  maxScore: number;
}) {
  const [state, formAction, pending] = useActionState(
    gradeSubmissionAction,
    emptyFormState,
  );

  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
      <input type="hidden" name="submissionId" value={submissionId} />
      <Field label={`Score (/${maxScore})`} error={state.fieldErrors?.score?.[0]}>
        <Input name="score" type="number" min={0} max={maxScore} required />
      </Field>
      <Field label="Feedback" error={state.fieldErrors?.feedback?.[0]}>
        <Textarea name="feedback" rows={1} placeholder="Clear, actionable feedback…" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Grade"}
        </Button>
      </div>
      {state.message ? (
        <p className={`sm:col-span-3 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
