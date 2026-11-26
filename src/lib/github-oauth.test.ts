import { describe, expect, it } from "vitest";
import { githubLoginError } from "./auth-errors";
import {
  githubRedirectUri,
  hashOAuthState,
  pickGitHubEmail,
  verifyOAuthState,
  type GitHubEmail,
} from "./github-oauth";

const emails: GitHubEmail[] = [
  { email: "secondary@example.com", primary: false, verified: true },
  { email: "primary@example.com", primary: true, verified: true },
  { email: "unverified@example.com", primary: false, verified: false },
];

describe("GitHub OAuth helpers", () => {
  it("prefers the verified primary email", () => {
    expect(pickGitHubEmail(emails, "public@example.com")).toBe("primary@example.com");
  });

  it("falls back to another verified email and then the public email", () => {
    expect(pickGitHubEmail([emails[0], emails[2]], null)).toBe("secondary@example.com");
    expect(pickGitHubEmail([emails[2]], "public@example.com")).toBe("public@example.com");
  });

  it("returns null when no verified email is available", () => {
    expect(pickGitHubEmail([emails[2]], null)).toBeNull();
  });

  it("builds the callback URL from the app URL", () => {
    expect(githubRedirectUri("http://localhost:3000/")).toBe(
      "http://localhost:3000/api/auth/github/callback",
    );
  });

  it("verifies OAuth state against its hash", () => {
    const state = "a-random-state-value";
    const hash = hashOAuthState(state);
    expect(verifyOAuthState(state, hash)).toBe(true);
    expect(verifyOAuthState("wrong-state", hash)).toBe(false);
    expect(verifyOAuthState(state, "short")).toBe(false);
  });
});

describe("GitHub login errors", () => {
  it("maps known error codes to messages", () => {
    expect(githubLoginError("github_denied")).toBe("GitHub sign-in was cancelled.");
    expect(githubLoginError("github_email")).toContain("verified email");
    expect(githubLoginError("unknown")).toBeNull();
  });
});
