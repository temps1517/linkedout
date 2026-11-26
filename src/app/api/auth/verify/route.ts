import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { verifyEmailAction } from "@/actions/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    redirect("/dashboard?verify=expired");
  }

  await verifyEmailAction(token);
}
