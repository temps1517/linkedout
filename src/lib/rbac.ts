import type { Role, SessionUser } from "@/types";

export function hasRole(user: Pick<SessionUser, "role">, roles: Role[]) {
  return roles.includes(user.role);
}

export function canModerate(user: Pick<SessionUser, "role">) {
  return hasRole(user, ["ADMIN"]);
}

export function canManageTraining(user: Pick<SessionUser, "role">) {
  return hasRole(user, ["TRAINER", "ADMIN"]);
}

export function canManageCompanies(user: Pick<SessionUser, "role">) {
  return hasRole(user, ["COMPANY", "ADMIN"]);
}

export function canViewPrivateProfile(
  viewer: Pick<SessionUser, "id" | "role">,
  targetUserId: string,
  connected: boolean,
) {
  return viewer.id === targetUserId || connected || viewer.role === "ADMIN";
}

export function canGradeSubmission(
  user: Pick<SessionUser, "id" | "role">,
  trainerId: string,
) {
  return user.id === trainerId || user.role === "ADMIN";
}

export function canEditCompany(
  user: Pick<SessionUser, "id" | "role">,
  company: { ownerId: string },
) {
  return user.id === company.ownerId || user.role === "ADMIN";
}

export function visibleRole(user: Pick<SessionUser, "role">, targetRole: Role) {
  if (user.role === "ADMIN" || user.role === "TRAINER") return targetRole;
  if (targetRole === "STUDENT") return "STUDENT";
  return "MEMBER";
}
