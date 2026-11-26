export function githubLoginError(code: string | null | undefined) {
  switch (code) {
    case "github_unavailable":
      return "GitHub sign-in is not configured on this server.";
    case "github_denied":
      return "GitHub sign-in was cancelled.";
    case "github_state":
      return "The GitHub sign-in request expired. Please try again.";
    case "github_email":
      return "Your GitHub account needs a verified email address to sign in.";
    case "github_failed":
      return "GitHub sign-in failed. Please try again.";
    default:
      return null;
  }
}
