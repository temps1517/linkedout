import "server-only";

import { db } from "@/lib/db";
import type { SessionUser } from "@/types";

export async function listCompanies(q?: string) {
  const companies = await db.company.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { industry: { contains: q } },
            { location: { contains: q } },
          ],
        }
      : {},
    include: {
      _count: {
        select: {
          opportunities: { where: { status: "OPEN" } },
          members: true,
        },
      },
    },
    orderBy: [{ verified: "desc" }, { name: "asc" }],
  });

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
    industry: company.industry,
    location: company.location,
    description: company.description,
    logoUrl: company.logoUrl,
    verified: company.verified,
    openOpportunities: company._count.opportunities,
    members: company._count.members,
  }));
}

export async function getCompany(companyId: string, user: SessionUser) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      owner: { select: { id: true, name: true, profile: { select: { name: true } } } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { id: true, name: true, headline: true, avatarUrl: true } },
            },
          },
        },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        include: {
          applications: { where: { userId: user.id }, select: { id: true, status: true } },
          _count: { select: { applications: true } },
        },
      },
      _count: { select: { posts: true } },
    },
  });

  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    website: company.website,
    industry: company.industry,
    location: company.location,
    description: company.description,
    logoUrl: company.logoUrl,
    verified: company.verified,
    ownerId: company.ownerId,
    ownerName: company.owner.profile?.name ?? company.owner.name,
    canEdit: user.id === company.ownerId || user.role === "ADMIN",
    posts: company._count.posts,
    members: company.members.map((member) => ({
      id: member.user.id,
      name: member.user.profile?.name ?? member.user.name,
      headline: member.user.profile?.headline ?? null,
      avatarUrl: member.user.profile?.avatarUrl ?? null,
      role: member.role,
      profileId: member.user.profile?.id ?? null,
    })),
    opportunities: company.opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      type: opportunity.type,
      location: opportunity.location,
      description: opportunity.description,
      requirements: opportunity.requirements,
      applicationUrl: opportunity.applicationUrl,
      status: opportunity.status,
      applicants: opportunity._count.applications,
      applied: opportunity.applications.length > 0,
      applicationStatus: opportunity.applications[0]?.status ?? null,
      createdAt: opportunity.createdAt,
    })),
  };
}

export async function listOpportunities(
  user: SessionUser,
  filters: { q?: string; type?: string; location?: string },
) {
  const opportunities = await db.opportunity.findMany({
    where: {
      status: "OPEN",
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.location ? { location: { contains: filters.location } } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q } },
              { description: { contains: filters.q } },
              { company: { name: { contains: filters.q } } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, name: true, location: true, verified: true, logoUrl: true } },
      applications: { where: { userId: user.id }, select: { id: true, status: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return opportunities.map((opportunity) => ({
    id: opportunity.id,
    title: opportunity.title,
    type: opportunity.type,
    location: opportunity.location,
    description: opportunity.description,
    requirements: opportunity.requirements,
    applicationUrl: opportunity.applicationUrl,
    createdAt: opportunity.createdAt,
    applicants: opportunity._count.applications,
    applied: opportunity.applications.length > 0,
    applicationStatus: opportunity.applications[0]?.status ?? null,
    company: opportunity.company,
  }));
}

export async function listManagedCompanies(user: SessionUser) {
  if (user.role === "ADMIN") {
    return db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  }

  return db.company.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: "ADMIN" } } }],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
