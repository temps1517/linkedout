import { NextResponse, type NextRequest } from "next/server";
import { generateToken } from "@/lib/auth";
import {
  GITHUB_AUTHORIZE_URL,
  GITHUB_STATE_COOKIE,
  githubRedirectUri,
  hashOAuthState,
} from "@/lib/github-oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=github_unavailable", request.nextUrl.origin),
    );
  }

  const state = generateToken();
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    githubRedirectUri(process.env.APP_URL ?? request.nextUrl.origin),
  );
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GITHUB_STATE_COOKIE, hashOAuthState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/github",
    maxAge: 600,
  });
  return response;
}
