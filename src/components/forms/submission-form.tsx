"use client";

import { useActionState, useState } from "react";
import { submitAssignmentAction } from "@/actions/training";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { emptyFormState } from "@/types";

export function SubmissionForm({
  assignmentId,
  currentFile,
}: {
  assignmentId: string;
  currentFile?: { id: string; name: string } | null;
}) {
  const [state, formAction, pending] = useActionState(
    submitAssignmentAction,
    emptyFormState,
  );
  const [fileAssetId, setFileAssetId] = useState(currentFile?.id ?? "");
  const [status, setStatus] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("Uploading…");
    const body = new FormData();
    body.set("file", file);
    body.set("visibility", "PRIVATE");

    try {
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = (await response.json()) as { id?: string; error?: string };
      if (response.ok && result.id) {
        setFileAssetId(result.id);
        setStatus("File ready.");
      } else {
        setStatus(result.error ?? "Upload failed.");
      }
    } catch {
      setStatus("Upload failed.");
    }
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="fileAssetId" value={fileAssetId} />

      <Field label="Your work" error={state.fieldErrors?.note?.[0]}>
        <Textarea
          name="note"
          rows={2}
          required={!fileAssetId}
          placeholder="Summary of your submission, repository link, or reflection…"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Input type="file" accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg,.jpeg" onChange={handleFile} />
        {currentFile ? (
          <a href={`/api/files/${currentFile.id}`} className="text-sm font-semibold text-primary">
            Current: {currentFile.name}
          </a>
        ) : null}
        {status ? <p className="text-xs text-muted">{status}</p> : null}
      </div>

      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting…" : currentFile ? "Update submission" : "Submit assignment"}
      </Button>
    </form>
  );
}
