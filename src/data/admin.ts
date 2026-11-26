import "server-only";

import { db } from "@/lib/db";

export async function getAdminStats() {
  const [users, posts, openReports, unverifiedCompanies, enrollments, applications] =
    await Promise.all([
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.company.count({ where: { verified: false } }),
      db.enrollment.count(),
      db.application.count(),
    ]);

  return {
    users: users.reduce((sum, group) => sum + group._count._all, 0),
    roles: Object.fromEntries(users.map((group) => [group.role, group._count._all])),
    posts,
    openReports,
    unverifiedCompanies,
    enrollments,
    applications,
  };
}

export async function listReports() {
  const reports = await db.report.findMany({
    include: {
      reporter: { select: { name: true, profile: { select: { name: true } } } },
      resolvedBy: { select: { name: true } },
      post: {
        select: {
          id: true,
          body: true,
          status: true,
          author: { select: { name: true, profile: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt,
    reporterName: report.reporter.profile?.name ?? report.reporter.name,
    resolvedByName: report.resolvedBy?.name ?? null,
    post: {
      id: report.post.id,
      body: report.post.body,
      status: report.post.status,
      authorName: report.post.author?.profile?.name ?? report.post.author?.name ?? "Unknown",
    },
  }));
}

export async function listAdminUsers() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      profile: { select: { name: true } },
      _count: { select: { posts: true, enrollments: true, applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return users.map((user) => ({
    id: user.id,
    name: user.profile?.name ?? user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
    posts: user._count.posts,
    enrollments: user._count.enrollments,
    applications: user._count.applications,
  }));
}

export async function listAdminCompanies() {
  const companies = await db.company.findMany({
    select: {
      id: true,
      name: true,
      verified: true,
      createdAt: true,
      owner: { select: { name: true, email: true } },
      _count: { select: { opportunities: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    verified: company.verified,
    createdAt: company.createdAt,
    ownerName: company.owner.name,
    ownerEmail: company.owner.email,
    opportunities: company._count.opportunities,
    members: company._count.members,
  }));
}

export async function listAuditLogs() {
  const logs = await db.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    actorName: log.actor.name,
    actorEmail: log.actor.email,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));
}
