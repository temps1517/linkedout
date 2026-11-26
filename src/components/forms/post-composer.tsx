"use client";

import { useActionState, useState } from "react";
import { createPostAction } from "@/actions/feed";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { POST_TYPES, POST_TYPE_LABELS, PROFILE_VISIBILITY } from "@/lib/constants";
import { emptyFormState } from "@/types";

export function PostComposer({
  companies,
}: {
  companies: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPostAction, emptyFormState);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    if (!files.length) return;

    setUploadStatus("Uploading media…");
    const uploaded: string[] = [];

    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      body.set("visibility", "PUBLIC");

      try {
        const response = await fetch("/api/uploads", { method: "POST", body });
        const result = (await response.json()) as { id?: string; error?: string };
        if (response.ok && result.id) uploaded.push(result.id);
      } catch {
        setUploadStatus("One or more files could not be uploaded.");
      }
    }

    setAssetIds((current) => [...current, ...uploaded].slice(0, 6));
    setUploadStatus(uploaded.length ? `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} ready.` : "Upload failed.");
  }

  return (
    <form action={formAction} className="space-y-4">
      {assetIds.map((id) => (
        <input key={id} type="hidden" name="mediaIds" value={id} />
      ))}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Post type">
          <Select name="type" defaultValue="UPDATE">
            {POST_TYPES.map((type) => (
              <option key={type} value={type}>
                {POST_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Visibility">
          <Select name="visibility" defaultValue="PUBLIC">
            {PROFILE_VISIBILITY.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Post as company (optional)">
          <Select name="companyId" defaultValue="">
            <option value="">Personal profile</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Share an update" error={state.fieldErrors?.body?.[0]}>
        <Textarea
          name="body"
          rows={4}
          required
          placeholder="What have you learned, built, achieved, or discovered?"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Input type="file" accept="image/*,video/mp4,.pdf,.doc,.docx" multiple onChange={handleFiles} />
        {uploadStatus ? <p className="text-xs text-muted">{uploadStatus}</p> : null}
      </div>

      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish post"}
      </Button>
    </form>
  );
}
