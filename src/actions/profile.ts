"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { trackActivity } from "@/lib/notifications";
import {
  existingSkillSchema,
  formErrors,
  profileItemSchema,
  profileSchema,
  skillSchema,
} from "@/lib/validation";
import type { FormState } from "@/types";

function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getMyProfileId(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found.");
  return profile.id;
}

export async function updateProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  await db.profile.update({
    where: { userId: user.id },
    data: {
      name: parsed.data.name,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      location: parsed.data.location,
      availability: parsed.data.availability,
      linkedinUrl: parsed.data.linkedinUrl,
      githubUrl: parsed.data.githubUrl,
      portfolioUrl: parsed.data.portfolioUrl,
      visibility: parsed.data.visibility,
      openToOpportunities: parsed.data.openToOpportunities,
    },
  });

  await trackActivity(user.id, "PROFILE_UPDATED", "PROFILE");
  revalidatePath("/profile/me");
  revalidatePath("/people");
  return { status: "success", message: "Profile saved." };
}

export async function addSkillAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const useExisting = Boolean(raw.skillId);
  const parsed = useExisting ? existingSkillSchema.safeParse(raw) : skillSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const profileId = await getMyProfileId(user.id);
  let skillId: string;

  if (useExisting) {
    skillId = (parsed.data as { skillId: string }).skillId;
    const exists = await db.skill.findUnique({ where: { id: skillId } });
    if (!exists) return { status: "error", message: "That skill was not found." };
  } else {
    const name = titleCase((parsed.data as { name: string }).name);
    const existing = await db.skill.findFirst({ where: { name } });
    const skill = existing ?? (await db.skill.create({ data: { name, category: "Professional" } }));
    skillId = skill.id;
  }

  const { level, years } = parsed.data as { level: string; years: number };

  await db.profileSkill.upsert({
    where: { profileId_skillId: { profileId, skillId } },
    create: { profileId, skillId, level, years },
    update: { level, years },
  });

  await trackActivity(user.id, "SKILL_ADDED", "SKILL", skillId);
  revalidatePath("/profile/me");
  return { status: "success", message: "Skill added to your profile." };
}

export async function addProfileItemAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileItemSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const profileId = await getMyProfileId(user.id);
  const { kind, title, secondary, description, url, date, fileAssetId } = parsed.data;
  const year = date && /^\d{4}$/.test(date) ? Number(date) : undefined;

  if (kind === "QUALIFICATION") {
    await db.qualification.create({
      data: {
        profileId,
        title,
        institution: secondary ?? "Institution not specified",
        year,
        credentialUrl: url,
      },
    });
  } else if (kind === "EXPERIENCE") {
    await db.experience.create({
      data: {
        profileId,
        title,
        organisation: secondary ?? "Organisation not specified",
        startDate: date,
        description,
        current: !date,
      },
    });
  } else if (kind === "PROJECT") {
    await db.project.create({
      data: {
        profileId,
        title,
        description,
        url,
        tags: secondary,
        startDate: date,
      },
    });
  } else if (kind === "ACHIEVEMENT") {
    await db.achievement.create({
      data: {
        profileId,
        title,
        description,
        issuedBy: secondary,
        issuedAt: date,
        url,
      },
    });
  } else {
    if (fileAssetId) {
      const asset = await db.fileAsset.findFirst({
        where: { id: fileAssetId, ownerId: user.id },
        select: { id: true, visibility: true },
      });
      if (!asset) return { status: "error", message: "That uploaded file was not found." };
      if (asset.visibility !== "PUBLIC") {
        await db.fileAsset.update({
          where: { id: asset.id },
          data: { visibility: "PUBLIC" },
        });
      }
    }

    await db.portfolioItem.create({
      data: {
        profileId,
        title,
        description,
        url,
        fileAssetId,
        kind: fileAssetId ? "FILE" : "LINK",
      },
    });
  }

  await trackActivity(user.id, "PROFILE_ITEM_ADDED", kind);
  revalidatePath("/profile/me");
  revalidatePath(`/profile/${profileId}`);
  return { status: "success", message: `${kind.toLowerCase().replaceAll("_", " ")} added.` };
}

export async function removeProfileItemAction(kind: string, id: string) {
  const user = await requireUser();
  const profileId = await getMyProfileId(user.id);

  if (kind === "QUALIFICATION") {
    await db.qualification.deleteMany({ where: { id, profileId } });
  } else if (kind === "EXPERIENCE") {
    await db.experience.deleteMany({ where: { id, profileId } });
  } else if (kind === "PROJECT") {
    await db.project.deleteMany({ where: { id, profileId } });
  } else if (kind === "ACHIEVEMENT") {
    await db.achievement.deleteMany({ where: { id, profileId } });
  } else if (kind === "PORTFOLIO") {
    await db.portfolioItem.deleteMany({ where: { id, profileId } });
  } else if (kind === "SKILL") {
    await db.profileSkill.deleteMany({ where: { id, profileId } });
  } else {
    return;
  }

  await trackActivity(user.id, "PROFILE_ITEM_REMOVED", kind, id);
  revalidatePath("/profile/me");
  revalidatePath(`/profile/${profileId}`);
}

export async function endorseSkillAction(profileSkillId: string) {
  const user = await requireUser();
  const profileSkill = await db.profileSkill.findUnique({
    where: { id: profileSkillId },
    include: { profile: { select: { userId: true } } },
  });

  if (!profileSkill || profileSkill.profile.userId === user.id) return;

  await db.endorsement.upsert({
    where: {
      profileSkillId_endorserId: { profileSkillId, endorserId: user.id },
    },
    create: { profileSkillId, endorserId: user.id },
    update: {},
  });

  revalidatePath(`/profile/${profileSkill.profileId}`);
  revalidatePath("/people");
}

export async function setAvatarAction(formData: FormData) {
  const user = await requireUser();
  const fileAssetId = String(formData.get("fileAssetId") ?? "");
  if (!fileAssetId) return;

  const asset = await db.fileAsset.findFirst({
    where: { id: fileAssetId, ownerId: user.id },
  });
  if (!asset) return;

  await db.fileAsset.update({
    where: { id: asset.id },
    data: { visibility: "PUBLIC" },
  });
  await db.profile.update({
    where: { userId: user.id },
    data: { avatarUrl: `/api/files/${asset.id}` },
  });

  revalidatePath("/profile/me");
  revalidatePath("/dashboard");
}

export async function setResumeAction(formData: FormData) {
  const user = await requireUser();
  const fileAssetId = String(formData.get("fileAssetId") ?? "");
  if (!fileAssetId) return;

  const asset = await db.fileAsset.findFirst({
    where: { id: fileAssetId, ownerId: user.id },
  });
  if (!asset) return;

  await db.profile.update({
    where: { userId: user.id },
    data: { resumeUrl: `/api/files/${asset.id}` },
  });

  revalidatePath("/profile/me");
}
