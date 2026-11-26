import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");
  const visibility = formData.get("visibility") === "PUBLIC" ? "PUBLIC" : "PRIVATE";

  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    const asset = await saveUpload({ file, ownerId: user.id, visibility });
    return Response.json({ ...asset, url: `/api/files/${asset.id}` });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
