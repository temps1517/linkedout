import { createHash, timingSafeEqual } from "node:crypto";

export const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
export const GITHUB_API_URL = "https://api.github.com";
export const GITHUB_STATE_COOKIE = "linkedout_github_state";

export type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export type GitHubProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  html_url: string | null;
};

export function githubRedirectUri(appUrl: string) {
  return new URL("/api/auth/github/callback", appUrl).toString();
}

export function hashOAuthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export function verifyOAuthState(state: string, expectedHash: string) {
  const actualHash = hashOAuthState(state);
  if (actualHash.length !== expectedHash.length) return false;
  return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

export function pickGitHubEmail(emails: GitHubEmail[], publicEmail?: string | null) {
  const verified = emails.filter((entry) => entry.verified && entry.email);
  return (
    verified.find((entry) => entry.primary)?.email ??
    verified[0]?.email ??
    publicEmail ??
    null
  );
}
