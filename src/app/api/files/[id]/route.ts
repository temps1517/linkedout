import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await context.params;

  const asset = await db.fileAsset.findUnique({
    where: { id },
    select: { id: true, name: true, mimeType: true, storageKey: true, visibility: true, ownerId: true },
  });

  if (!asset) {
    return new Response("File not found.", { status: 404 });
  }

  const trainerAccess = await db.submission.findFirst({
    where: {
      fileAssetId: asset.id,
      assignment: { module: { program: { trainerId: user.id } } },
    },
    select: { id: true },
  });

  const allowed =
    asset.visibility === "PUBLIC" ||
    asset.ownerId === user.id ||
    user.role === "ADMIN" ||
    Boolean(trainerAccess);

  if (!allowed) {
    return new Response("You do not have access to this file.", { status: 403 });
  }

  const buffer = await readUpload(asset.storageKey);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${asset.name.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
