"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UploadField({
  name,
  label,
  accept,
  visibility,
  initialAssetId,
}: {
  name: string;
  label: string;
  accept: string;
  visibility: "PUBLIC" | "PRIVATE";
  initialAssetId?: string;
}) {
  const [assetId, setAssetId] = useState(initialAssetId ?? "");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("Uploading…");

    const body = new FormData();
    body.set("file", file);
    body.set("visibility", visibility);

    try {
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        setStatus(result.error ?? "Upload failed.");
      } else {
        setAssetId(result.id);
        setStatus(`Uploaded: ${file.name}`);
      }
    } catch {
      setStatus("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-3">
      <label className="block text-sm font-semibold">{label}</label>
      <Input
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={uploading}
        className="mt-2 bg-white"
      />
      <input type="hidden" name={name} value={assetId} />
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
      {assetId ? (
        <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => setAssetId("")}>
          Clear file
        </Button>
      ) : null}
    </div>
  );
}
