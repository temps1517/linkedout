import { describe, expect, it } from "vitest";
import { calculateProgress, shouldIssueCertificate } from "./progress";

describe("calculateProgress", () => {
  it("weights graded assignments at 70% and completed sessions at 30%", () => {
    expect(
      calculateProgress({
        gradedAssignments: 10,
        totalAssignments: 20,
        completedSessions: 3,
        totalSessions: 10,
      }),
    ).toBe(44);
  });

  it("returns 100 for complete work and clamps out-of-range values", () => {
    expect(
      calculateProgress({
        gradedAssignments: 5,
        totalAssignments: 5,
        completedSessions: 4,
        totalSessions: 4,
      }),
    ).toBe(100);
    expect(
      calculateProgress({
        gradedAssignments: 6,
        totalAssignments: 5,
        completedSessions: 5,
        totalSessions: 4,
      }),
    ).toBe(100);
  });

  it("issues certificates only at full completion", () => {
    expect(shouldIssueCertificate(99)).toBe(false);
    expect(shouldIssueCertificate(100)).toBe(true);
  });
});
