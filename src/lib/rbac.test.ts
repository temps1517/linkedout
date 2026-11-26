import { describe, expect, it } from "vitest";
import {
  canEditCompany,
  canManageTraining,
  canModerate,
  canViewPrivateProfile,
  hasRole,
} from "./rbac";

const user = { id: "u1", role: "STUDENT" as const };

describe("rbac", () => {
  it("checks roles", () => {
    expect(hasRole(user, ["STUDENT", "TRAINER"])).toBe(true);
    expect(hasRole(user, ["ADMIN"])).toBe(false);
  });

  it("restricts moderation and training management", () => {
    expect(canModerate({ role: "ADMIN" })).toBe(true);
    expect(canModerate({ role: "TRAINER" })).toBe(false);
    expect(canManageTraining({ role: "TRAINER" })).toBe(true);
    expect(canManageTraining({ role: "STUDENT" })).toBe(false);
  });

  it("allows private profile access only to self, connections, and admins", () => {
    expect(canViewPrivateProfile(user, "u1", false)).toBe(true);
    expect(canViewPrivateProfile(user, "u2", true)).toBe(true);
    expect(canViewPrivateProfile(user, "u2", false)).toBe(false);
    expect(canViewPrivateProfile({ id: "u3", role: "ADMIN" }, "u2", false)).toBe(true);
  });

  it("allows company owners and admins to edit companies", () => {
    expect(canEditCompany({ id: "u1", role: "COMPANY" }, { ownerId: "u1" })).toBe(true);
    expect(canEditCompany({ id: "u2", role: "COMPANY" }, { ownerId: "u1" })).toBe(false);
    expect(canEditCompany({ id: "u2", role: "ADMIN" }, { ownerId: "u1" })).toBe(true);
  });
});
