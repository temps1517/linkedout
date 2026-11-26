import { NextResponse, type NextRequest } from "next/server";
import { createSession, generateToken, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  GITHUB_API_URL,
  GITHUB_STATE_COOKIE,
  GITHUB_TOKEN_URL,
  githubRedirectUri,
  pickGitHubEmail,
  verifyOAuthState,
  type GitHubEmail,
  type GitHubProfile,
} from "@/lib/github-oauth";
import { trackActivity } from "@/lib/notifications";

function loginRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, request.nextUrl.origin),
  );
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set({
    name: GITHUB_STATE_COOKIE,
    value: "",
    path: "/api/auth/github",
    maxAge: 0,
  });
  return response;
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T | null> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const errorCode = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(GITHUB_STATE_COOKIE)?.value;

  if (
    errorCode ||
    !code ||
    !state ||
    !expectedState ||
    !verifyOAuthState(state, expectedState)
  ) {
    const error =
      errorCode === "access_denied"
        ? "github_denied"
        : errorCode
          ? "github_failed"
          : "github_state";
    return clearStateCookie(loginRedirect(request, error));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return clearStateCookie(loginRedirect(request, "github_unavailable"));
  }

  try {
    const tokenData = await fetchJson<{ access_token?: string }>(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "linkedout",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: githubRedirectUri(process.env.APP_URL ?? request.nextUrl.origin),
      }),
    });

    if (!tokenData?.access_token) {
      return clearStateCookie(loginRedirect(request, "github_failed"));
    }

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "linkedout",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const profile = await fetchJson<GitHubProfile>(`${GITHUB_API_URL}/user`, { headers });
    if (!profile?.id || !profile.login) {
      return clearStateCookie(loginRedirect(request, "github_failed"));
    }

    const emails =
      (await fetchJson<GitHubEmail[]>(`${GITHUB_API_URL}/user/emails`, { headers })) ?? [];
    const email = pickGitHubEmail(emails, profile.email)?.toLowerCase();

    if (!email) {
      return clearStateCookie(loginRedirect(request, "github_email"));
    }

    const githubId = String(profile.id);
    let user = await db.user.findUnique({ where: { githubId }, select: { id: true } });

    if (!user) {
      const existing = await db.user.findUnique({
        where: { email },
        select: { id: true, githubId: true, emailVerifiedAt: true },
      });

      if (existing) {
        if (existing.githubId && existing.githubId !== githubId) {
          return clearStateCookie(loginRedirect(request, "github_failed"));
        }

        await db.user.update({
          where: { id: existing.id },
          data: { githubId, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
        });
        user = { id: existing.id };
      } else {
        const name = (profile.name ?? profile.login).trim().slice(0, 80) || "GitHub user";
        user = await db.user.create({
          data: {
            email,
            name,
            passwordHash: await hashPassword(generateToken()),
            githubId,
            emailVerifiedAt: new Date(),
            profile: {
              create: {
                name,
                githubUrl: profile.html_url ?? `https://github.com/${profile.login}`,
                avatarUrl: profile.avatar_url,
              },
            },
          },
          select: { id: true },
        });
      }
    }

    await createSession(user.id);
    await trackActivity(user.id, "LOGIN", "USER", user.id, { provider: "github" });

    return clearStateCookie(NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin)));
  } catch (error) {
    console.error("GitHub OAuth callback failed", error);
    return clearStateCookie(loginRedirect(request, "github_failed"));
  }
}
