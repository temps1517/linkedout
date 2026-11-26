export function calculateProgress(input: {
  gradedAssignments: number;
  totalAssignments: number;
  completedSessions: number;
  totalSessions: number;
}) {
  const assignmentScore =
    input.totalAssignments > 0
      ? (input.gradedAssignments / input.totalAssignments) * 70
      : 0;
  const sessionScore =
    input.totalSessions > 0 ? (input.completedSessions / input.totalSessions) * 30 : 0;
  const total = Math.round(assignmentScore + sessionScore);
  return Math.min(Math.max(total, 0), 100);
}

export function shouldIssueCertificate(progress: number) {
  return progress >= 100;
}
