"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditCompany, canManageCompanies } from "@/lib/rbac";
import { notifyUser, trackActivity, writeAuditLog } from "@/lib/notifications";
import {
  companySchema,
  formErrors,
  opportunitySchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { FormState, SessionUser } from "@/types";

async function requireCompanyEditor(user: SessionUser, companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, ownerId: true, name: true },
  });
  if (!company || !canEditCompany(user, company)) return null;
  return company;
}

export async function createCompanyAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!canManageCompanies(user)) {
    return { status: "error", message: "Only company representatives and admins can create company profiles." };
  }

  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const baseSlug = slugify(parsed.data.name) || "company";
  let slug = baseSlug;
  let suffix = 2;
  while (await db.company.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const company = await db.company.create({
    data: {
      ...parsed.data,
      slug,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    select: { id: true },
  });

  await writeAuditLog(user.id, "COMPANY_CREATED", "COMPANY", company.id);
  revalidatePath("/companies");
  return { status: "success", message: "Company profile created." };
}

export async function updateCompanyAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const companyId = String(formData.get("companyId") ?? "");
  const company = await requireCompanyEditor(user, companyId);
  if (!company) return { status: "error", message: "You cannot edit that company." };

  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  await db.company.update({ where: { id: companyId }, data: parsed.data });
  await writeAuditLog(user.id, "COMPANY_UPDATED", "COMPANY", companyId);
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  return { status: "success", message: "Company profile updated." };
}

export async function verifyCompanyAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) return;

  await db.company.update({ where: { id: companyId }, data: { verified: true } });
  await writeAuditLog(user.id, "COMPANY_VERIFIED", "COMPANY", companyId);
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/admin");
}

export async function createOpportunityAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const company = await requireCompanyEditor(user, parsed.data.companyId);
  if (!company) return { status: "error", message: "You cannot post for that company." };

  const opportunity = await db.opportunity.create({
    data: { ...parsed.data, status: "OPEN" },
    select: { id: true },
  });

  await trackActivity(user.id, "OPPORTUNITY_CREATED", "OPPORTUNITY", opportunity.id);
  await writeAuditLog(user.id, "OPPORTUNITY_CREATED", "OPPORTUNITY", opportunity.id);
  revalidatePath("/opportunities");
  revalidatePath(`/companies/${company.id}`);
  return { status: "success", message: "Opportunity published." };
}

export async function updateOpportunityStatusAction(formData: FormData) {
  const user = await requireUser();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "OPEN" && status !== "CLOSED") return;

  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
    select: { companyId: true },
  });
  if (!opportunity) return;

  const company = await requireCompanyEditor(user, opportunity.companyId);
  if (!company) return;

  await db.opportunity.update({ where: { id: opportunityId }, data: { status } });
  await writeAuditLog(user.id, "OPPORTUNITY_STATUS", "OPPORTUNITY", opportunityId, { status });
  revalidatePath("/opportunities");
  revalidatePath(`/companies/${company.id}`);
}

export async function applyToOpportunityAction(formData: FormData) {
  const user = await requireUser();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) return;

  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { company: { select: { id: true, ownerId: true, name: true } } },
  });
  if (!opportunity || opportunity.status !== "OPEN") return;

  await db.application.upsert({
    where: { opportunityId_userId: { opportunityId, userId: user.id } },
    create: { opportunityId, userId: user.id },
    update: { status: "APPLIED" },
  });

  await notifyUser({
    userId: opportunity.company.ownerId,
    type: "APPLICATION",
    title: `${user.name} applied to ${opportunity.title}`,
    body: `A new application was submitted at ${opportunity.company.name}.`,
    href: `/companies/${opportunity.company.id}`,
  });
  await trackActivity(user.id, "APPLICATION_SUBMITTED", "OPPORTUNITY", opportunityId);

  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
}

export async function withdrawApplicationAction(formData: FormData) {
  const user = await requireUser();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) return;

  await db.application.deleteMany({ where: { opportunityId, userId: user.id } });
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
}
