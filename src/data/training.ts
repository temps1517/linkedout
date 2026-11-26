import "server-only";

import { db } from "@/lib/db";
import { canManageProgram } from "@/lib/training";
import type { SessionUser } from "@/types";

export async function listPrograms(user: SessionUser) {
  const programs = await db.program.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { trainerId: user.id },
        ...(user.role === "ADMIN" ? [{ status: "DRAFT" }] : []),
      ],
    },
    include: {
      trainer: { select: { name: true, profile: { select: { name: true } } } },
      cohorts: {
        orderBy: { createdAt: "asc" },
        include: {
          enrollments: { where: { userId: user.id }, select: { id: true } },
          _count: { select: { enrollments: true } },
        },
      },
      modules: {
        orderBy: { position: "asc" },
        include: {
          _count: { select: { sessions: true, assignments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return programs.map((program) => ({
    id: program.id,
    title: program.title,
    slug: program.slug,
    summary: program.summary,
    status: program.status,
    startDate: program.startDate,
    endDate: program.endDate,
    trainerName: program.trainer.profile?.name ?? program.trainer.name,
    cohorts: program.cohorts.map((cohort) => ({
      id: cohort.id,
      name: cohort.name,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      capacity: cohort.capacity,
      enrolled: cohort._count.enrollments,
      isEnrolled: cohort.enrollments.length > 0,
    })),
    sessionCount: program.modules.reduce((sum, module) => sum + module._count.sessions, 0),
    assignmentCount: program.modules.reduce((sum, module) => sum + module._count.assignments, 0),
  }));
}

export async function getProgram(programId: string, user: SessionUser) {
  const program = await db.program.findUnique({
    where: { id: programId },
    include: {
      trainer: { select: { name: true, profile: { select: { name: true } } } },
      cohorts: {
        orderBy: { createdAt: "asc" },
        include: {
          enrollments: {
            where: { userId: user.id },
            include: { progressEvents: true, certificate: true },
          },
          _count: { select: { enrollments: true } },
        },
      },
      modules: {
        orderBy: { position: "asc" },
        include: {
          sessions: { orderBy: { position: "asc" } },
          assignments: {
            orderBy: { createdAt: "asc" },
            include: {
              submissions: {
                where: { userId: user.id },
                include: {
                  grade: true,
                  fileAsset: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!program) return null;
  if (program.status !== "PUBLISHED" && !(await canManageProgram(user, program.id))) return null;

  const enrollment = program.cohorts.flatMap((cohort) => cohort.enrollments)[0] ?? null;
  const completedSessionIds = new Set(
    enrollment?.progressEvents
      .filter((event) => event.kind === "SESSION_COMPLETED" && event.metadata)
      .map((event) => event.metadata as string) ?? [],
  );

  return {
    id: program.id,
    title: program.title,
    summary: program.summary,
    description: program.description,
    status: program.status,
    startDate: program.startDate,
    endDate: program.endDate,
    trainerName: program.trainer.profile?.name ?? program.trainer.name,
    canManage: await canManageProgram(user, program.id),
    cohorts: program.cohorts.map((cohort) => ({
      id: cohort.id,
      name: cohort.name,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      capacity: cohort.capacity,
      enrolled: cohort._count.enrollments,
    })),
    enrollment: enrollment
      ? {
          id: enrollment.id,
          progress: enrollment.progress,
          status: enrollment.status,
          completedAt: enrollment.completedAt,
          certificate: enrollment.certificate
            ? {
                id: enrollment.certificate.id,
                verificationCode: enrollment.certificate.verificationCode,
                issuedAt: enrollment.certificate.issuedAt,
              }
            : null,
        }
      : null,
    modules: program.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      position: module.position,
      sessions: module.sessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        content: session.content,
        completed: completedSessionIds.has(session.id),
      })),
      assignments: module.assignments.map((assignment) => {
        const submission = assignment.submissions[0] ?? null;
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueAt: assignment.dueAt,
          maxScore: assignment.maxScore,
          submission: submission
            ? {
                id: submission.id,
                status: submission.status,
                note: submission.note,
                submittedAt: submission.submittedAt,
                file: submission.fileAsset,
                grade: submission.grade
                  ? {
                      score: submission.grade.score,
                      feedback: submission.grade.feedback,
                      gradedAt: submission.grade.gradedAt,
                    }
                  : null,
              }
            : null,
        };
      }),
    })),
  };
}

export async function listTrainerPrograms(user: SessionUser) {
  const programs = await db.program.findMany({
    where: user.role === "ADMIN" ? {} : { trainerId: user.id },
    include: {
      cohorts: {
        include: { _count: { select: { enrollments: true } } },
      },
      modules: {
        include: {
          _count: { select: { sessions: true, assignments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return programs.map((program) => ({
    id: program.id,
    title: program.title,
    slug: program.slug,
    status: program.status,
    cohorts: program.cohorts.map((cohort) => ({
      id: cohort.id,
      name: cohort.name,
      enrolled: cohort._count.enrollments,
    })),
    modules: program.modules.map((module) => ({ id: module.id, title: module.title })),
    sessionCount: program.modules.reduce((sum, module) => sum + module._count.sessions, 0),
    assignmentCount: program.modules.reduce((sum, module) => sum + module._count.assignments, 0),
  }));
}

export async function listGradingQueue(user: SessionUser) {
  const programFilter = user.role === "ADMIN" ? {} : { trainerId: user.id };

  const submissions = await db.submission.findMany({
    where: {
      grade: null,
      assignment: { module: { program: programFilter } },
    },
    include: {
      user: { select: { name: true, profile: { select: { name: true } } } },
      assignment: {
        select: {
          title: true,
          maxScore: true,
          module: { select: { title: true, program: { select: { title: true, id: true } } } },
        },
      },
      fileAsset: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
  });

  return submissions.map((submission) => ({
    id: submission.id,
    learnerName: submission.user.profile?.name ?? submission.user.name,
    assignmentTitle: submission.assignment.title,
    moduleTitle: submission.assignment.module.title,
    programTitle: submission.assignment.module.program.title,
    programId: submission.assignment.module.program.id,
    maxScore: submission.assignment.maxScore,
    note: submission.note,
    file: submission.fileAsset,
    submittedAt: submission.submittedAt,
  }));
}
