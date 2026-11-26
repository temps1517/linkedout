import "server-only";

import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export async function getDashboardData(user: SessionUser) {
  const [
    connections,
    posts,
    unreadNotifications,
    enrollments,
    applications,
    openOpportunities,
    companies,
    publishedPrograms,
    submissions,
    pendingGrades,
    openReports,
  ] = await Promise.all([
    db.connection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    }),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.enrollment.count({ where: { userId: user.id } }),
    db.application.count({ where: { userId: user.id } }),
    db.opportunity.count({ where: { status: "OPEN" } }),
    db.company.count(),
    db.program.count({ where: { status: "PUBLISHED" } }),
    db.submission.count({ where: { userId: user.id } }),
    db.submission.count({
      where: {
        status: "SUBMITTED",
        assignment: { module: { program: { trainerId: user.id } } },
      },
    }),
    db.report.count({ where: { status: "OPEN" } }),
  ]);

  const [recentActivity, recentPosts, learnerProgress] = await Promise.all([
    db.activityEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        author: { select: { name: true } },
        company: { select: { name: true } },
      },
    }),
    db.enrollment.findMany({
      where: { userId: user.id },
      include: { cohort: { include: { program: true } } },
      orderBy: { enrolledAt: "desc" },
      take: 3,
    }),
  ]);

  return {
    counts: {
      connections,
      posts,
      unreadNotifications,
      enrollments,
      applications,
      openOpportunities,
      companies,
      publishedPrograms,
      submissions,
      pendingGrades,
      openReports,
    },
    recentActivity,
    recentPosts,
    learnerProgress,
  };
}
