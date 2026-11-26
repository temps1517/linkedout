import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function uploadPath(storageKey: string) {
  return path.join(process.cwd(), ".data", "uploads", path.basename(storageKey));
}

const MIME_MAP: Record<string, { extension: string; kind: string; maxSize: number }> = {
  "image/jpeg": { extension: "jpg", kind: "IMAGE", maxSize: 10 * 1024 * 1024 },
  "image/png": { extension: "png", kind: "IMAGE", maxSize: 10 * 1024 * 1024 },
  "image/webp": { extension: "webp", kind: "IMAGE", maxSize: 10 * 1024 * 1024 },
  "image/gif": { extension: "gif", kind: "IMAGE", maxSize: 10 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", kind: "VIDEO", maxSize: 50 * 1024 * 1024 },
  "application/pdf": { extension: "pdf", kind: "DOCUMENT", maxSize: 15 * 1024 * 1024 },
  "application/msword": { extension: "doc", kind: "DOCUMENT", maxSize: 15 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: "docx",
    kind: "DOCUMENT",
    maxSize: 15 * 1024 * 1024,
  },
};

export async function saveUpload(input: {
  file: File;
  ownerId: string;
  visibility: "PUBLIC" | "PRIVATE";
}) {
  const meta = MIME_MAP[input.file.type];

  if (!meta) {
    throw new Error("That file type is not supported.");
  }

  if (input.file.size > meta.maxSize) {
    throw new Error("That file is too large.");
  }

  const storageKey = `${randomUUID()}.${meta.extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(uploadPath(storageKey), Buffer.from(await input.file.arrayBuffer()));

  const asset = await db.fileAsset.create({
    data: {
      ownerId: input.ownerId,
      name: input.file.name.slice(0, 180) || `upload.${meta.extension}`,
      mimeType: input.file.type,
      size: input.file.size,
      storageKey,
      visibility: input.visibility,
      kind: meta.kind,
    },
    select: { id: true, name: true, mimeType: true, visibility: true, kind: true },
  });

  return asset;
}

export async function readUpload(storageKey: string) {
  return readFile(uploadPath(storageKey));
}
