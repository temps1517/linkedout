"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageTraining } from "@/lib/rbac";
import { canManageProgram, refreshEnrollmentProgress } from "@/lib/training";
import { notifyUser, trackActivity, writeAuditLog } from "@/lib/notifications";
import {
  assignmentSchema,
  cohortSchema,
  formErrors,
  gradeSchema,
  moduleSchema,
  programSchema,
  sessionSchema,
  submissionSchema,
} from "@/lib/validation";
import type { FormState, SessionUser } from "@/types";

function managerOnly(user: SessionUser) {
  return canManageTraining(user) ? null : "Only trainers and admins can manage training.";
}

export async function createProgramAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const denied = managerOnly(user);
  if (denied) return { status: "error", message: denied };

  const parsed = programSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const slug = parsed.data.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (await db.program.findUnique({ where: { slug }, select: { id: true } })) {
    return { status: "error", fieldErrors: { slug: ["That slug is already in use."] } };
  }

  const program = await db.program.create({
    data: {
      ...parsed.data,
      slug,
      trainerId: user.id,
      status: "DRAFT",
    },
    select: { id: true },
  });

  await writeAuditLog(user.id, "PROGRAM_CREATED", "PROGRAM", program.id);
  revalidatePath("/trainer");
  revalidatePath("/training");
  return { status: "success", message: "Programme created as a draft." };
}

export async function createCohortAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = cohortSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }
  if (!(await canManageProgram(user, parsed.data.programId))) {
    return { status: "error", message: "You cannot manage this programme." };
  }

  const cohort = await db.cohort.create({ data: parsed.data, select: { id: true } });
  await writeAuditLog(user.id, "COHORT_CREATED", "COHORT", cohort.id);
  revalidatePath("/trainer");
  revalidatePath("/training");
  return { status: "success", message: "Cohort created." };
}

export async function createModuleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }
  if (!(await canManageProgram(user, parsed.data.programId))) {
    return { status: "error", message: "You cannot manage this programme." };
  }

  const moduleRecord = await db.module.create({ data: parsed.data, select: { id: true } });
  await writeAuditLog(user.id, "MODULE_CREATED", "MODULE", moduleRecord.id);
  revalidatePath("/trainer");
  revalidatePath(`/training/${parsed.data.programId}`);
  return { status: "success", message: "Module created." };
}

export async function createSessionAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = sessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const moduleRecord = await db.module.findUnique({
    where: { id: parsed.data.moduleId },
    select: { programId: true },
  });
  if (!moduleRecord || !(await canManageProgram(user, moduleRecord.programId))) {
    return { status: "error", message: "You cannot manage this module." };
  }

  const session = await db.trainingSession.create({
    data: parsed.data,
    select: { id: true },
  });
  await writeAuditLog(user.id, "SESSION_CREATED", "SESSION", session.id);
  revalidatePath("/trainer");
  revalidatePath(`/training/${moduleRecord.programId}`);
  return { status: "success", message: "Session created." };
}

export async function createAssignmentAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const moduleRecord = await db.module.findUnique({
    where: { id: parsed.data.moduleId },
    select: { programId: true },
  });
  if (!moduleRecord || !(await canManageProgram(user, moduleRecord.programId))) {
    return { status: "error", message: "You cannot manage this module." };
  }

  const assignment = await db.assignment.create({
    data: parsed.data,
    select: { id: true },
  });
  await writeAuditLog(user.id, "ASSIGNMENT_CREATED", "ASSIGNMENT", assignment.id);
  revalidatePath("/trainer");
  revalidatePath(`/training/${moduleRecord.programId}`);
  return { status: "success", message: "Assignment created." };
}

export async function publishProgramAction(formData: FormData) {
  const user = await requireUser();
  const programId = String(formData.get("programId") ?? "");
  if (!programId || !(await canManageProgram(user, programId))) return;

  await db.program.update({ where: { id: programId }, data: { status: "PUBLISHED" } });
  await writeAuditLog(user.id, "PROGRAM_PUBLISHED", "PROGRAM", programId);
  revalidatePath("/trainer");
  revalidatePath("/training");
  revalidatePath(`/training/${programId}`);
}

export async function enrollAction(formData: FormData) {
  const user = await requireUser();
  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) return;

  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    include: {
      program: { select: { id: true, title: true, status: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!cohort || cohort.program.status !== "PUBLISHED") return;
  if (cohort.capacity && cohort._count.enrollments >= cohort.capacity) return;

  const existing = await db.enrollment.findUnique({
    where: { cohortId_userId: { cohortId, userId: user.id } },
    select: { id: true },
  });
  if (existing) return;

  const enrollment = await db.enrollment.create({
    data: { cohortId, userId: user.id },
    select: { id: true },
  });

  await trackActivity(user.id, "ENROLLED", "PROGRAM", cohort.program.id);
  await notifyUser({
    userId: user.id,
    type: "ENROLLMENT",
    title: `You joined ${cohort.program.title}`,
    body: `Welcome to ${cohort.name}.`,
    href: `/training/${cohort.program.id}`,
    email: true,
  });

  revalidatePath(`/training/${cohort.program.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/trainer");
  void enrollment;
}

export async function completeSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  const session = await db.trainingSession.findUnique({
    where: { id: sessionId },
    include: { module: { select: { programId: true } } },
  });
  if (!session) return;

  const programId = session.module.programId;
  const enrollment = await db.enrollment.findFirst({
    where: { user: { id: user.id }, cohort: { programId } },
    select: { id: true, progressEvents: { where: { kind: "SESSION_COMPLETED", metadata: sessionId } } },
  });
  if (!enrollment || enrollment.progressEvents.length) return;

  await db.progressEvent.create({
    data: {
      enrollmentId: enrollment.id,
      kind: "SESSION_COMPLETED",
      description: session.title,
      metadata: sessionId,
    },
  });

  await refreshEnrollmentProgress(enrollment.id);
  await trackActivity(user.id, "SESSION_COMPLETED", "SESSION", sessionId);

  revalidatePath(`/training/${programId}`);
  revalidatePath("/dashboard");
}

export async function submitAssignmentAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const assignment = await db.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: {
      module: {
        select: {
          programId: true,
          program: { select: { trainerId: true, title: true } },
        },
      },
    },
  });
  if (!assignment) return { status: "error", message: "Assignment not found." };

  const enrollment = await db.enrollment.findFirst({
    where: { userId: user.id, cohort: { programId: assignment.module.programId } },
    select: { id: true },
  });
  if (!enrollment) return { status: "error", message: "Enrol in the programme first." };

  if (parsed.data.fileAssetId) {
    const file = await db.fileAsset.findUnique({
      where: { id: parsed.data.fileAssetId },
      select: { ownerId: true },
    });
    if (file?.ownerId !== user.id) {
      return { status: "error", message: "That uploaded file cannot be used." };
    }
  }

  await db.submission.upsert({
    where: {
      assignmentId_userId: { assignmentId: assignment.id, userId: user.id },
    },
    create: {
      assignmentId: assignment.id,
      userId: user.id,
      enrollmentId: enrollment.id,
      note: parsed.data.note,
      fileAssetId: parsed.data.fileAssetId,
    },
    update: {
      enrollmentId: enrollment.id,
      note: parsed.data.note,
      fileAssetId: parsed.data.fileAssetId,
      status: "SUBMITTED",
    },
  });

  await notifyUser({
    userId: assignment.module.program.trainerId,
    type: "SUBMISSION",
    title: `${user.name} submitted ${assignment.title}`,
    body: parsed.data.note,
    href: "/trainer",
  });
  await trackActivity(user.id, "ASSIGNMENT_SUBMITTED", "ASSIGNMENT", assignment.id);

  revalidatePath(`/training/${assignment.module.programId}`);
  revalidatePath("/trainer");
  return { status: "success", message: "Assignment submitted." };
}

export async function gradeSubmissionAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = gradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const submission = await db.submission.findUnique({
    where: { id: parsed.data.submissionId },
    include: {
      user: { select: { id: true } },
      assignment: {
        select: {
          title: true,
          maxScore: true,
          module: { select: { programId: true, program: { select: { trainerId: true } } } },
        },
      },
      grade: { select: { id: true } },
    },
  });
  if (!submission) return { status: "error", message: "Submission not found." };

  const programId = submission.assignment.module.programId;
  if (!(await canManageProgram(user, programId))) {
    return { status: "error", message: "You cannot grade this submission." };
  }
  if (parsed.data.score > submission.assignment.maxScore) {
    return {
      status: "error",
      fieldErrors: { score: [`Maximum score is ${submission.assignment.maxScore}.`] },
    };
  }

  const wasGraded = Boolean(submission.grade);
  await db.grade.upsert({
    where: { submissionId: submission.id },
    create: {
      submissionId: submission.id,
      score: parsed.data.score,
      feedback: parsed.data.feedback,
      gradedById: user.id,
    },
    update: {
      score: parsed.data.score,
      feedback: parsed.data.feedback,
      gradedById: user.id,
      gradedAt: new Date(),
    },
  });

  await db.submission.update({
    where: { id: submission.id },
    data: { status: "GRADED" },
  });

  if (!wasGraded) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: submission.user.id,
        cohort: { programId },
      },
      select: { id: true },
    });
    if (enrollment) {
      await db.progressEvent.create({
        data: {
          enrollmentId: enrollment.id,
          kind: "ASSIGNMENT_GRADED",
          description: submission.assignment.title,
          scoreDelta: parsed.data.score,
          metadata: submission.id,
        },
      });
      await refreshEnrollmentProgress(enrollment.id);
    }
  }

  await notifyUser({
    userId: submission.user.id,
    type: "GRADE",
    title: `Your ${submission.assignment.title} was graded`,
    body: `Score: ${parsed.data.score}/${submission.assignment.maxScore}${parsed.data.feedback ? `. ${parsed.data.feedback}` : ""}`,
    href: `/training/${programId}`,
    email: true,
  });
  await writeAuditLog(user.id, "SUBMISSION_GRADED", "SUBMISSION", submission.id);

  revalidatePath(`/training/${programId}`);
  revalidatePath("/trainer");
  revalidatePath("/dashboard");
  return { status: "success", message: "Grade saved." };
}
