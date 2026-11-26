import "server-only";

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { calculateProgress, shouldIssueCertificate } from "@/lib/progress";
import type { SessionUser } from "@/types";

export async function canManageProgram(user: SessionUser, programId: string) {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TRAINER") return false;

  const program = await db.program.findUnique({
    where: { id: programId },
    select: { trainerId: true },
  });

  return program?.trainerId === user.id;
}

export async function refreshEnrollmentProgress(enrollmentId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { id: true, name: true } },
      cohort: {
        include: {
          program: {
            include: {
              modules: {
                include: {
                  sessions: { select: { id: true } },
                  assignments: { select: { id: true } },
                },
              },
            },
          },
        },
      },
      progressEvents: { select: { kind: true, metadata: true } },
      certificate: { select: { id: true } },
    },
  });

  if (!enrollment) return;

  const programId = enrollment.cohort.programId;
  const sessionIds = enrollment.cohort.program.modules.flatMap((module) =>
    module.sessions.map((session) => session.id),
  );
  const assignmentIds = enrollment.cohort.program.modules.flatMap((module) =>
    module.assignments.map((assignment) => assignment.id),
  );

  const completedSessionIds = new Set(
    enrollment.progressEvents
      .filter(
        (event) =>
          event.kind === "SESSION_COMPLETED" &&
          event.metadata &&
          sessionIds.includes(event.metadata),
      )
      .map((event) => event.metadata as string),
  );

  const [gradedAssignments, totalAssignments] = await Promise.all([
    db.submission.count({
      where: {
        userId: enrollment.userId,
        assignmentId: { in: assignmentIds },
        grade: { isNot: null },
      },
    }),
    db.assignment.count({ where: { module: { programId } } }),
  ]);

  const progress = calculateProgress({
    gradedAssignments,
    totalAssignments,
    completedSessions: completedSessionIds.size,
    totalSessions: sessionIds.length,
  });

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress,
      completedAt: shouldIssueCertificate(progress) ? new Date() : null,
    },
  });

  if (shouldIssueCertificate(progress) && !enrollment.certificate) {
    await db.certificate.create({
      data: {
        enrollmentId,
        userId: enrollment.userId,
        verificationCode: randomBytes(8).toString("hex").toUpperCase(),
      },
    });
  }

  return progress;
}
