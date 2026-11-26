import { z } from "zod";
import {
  OPPORTUNITY_TYPES,
  POST_TYPES,
  PROFILE_VISIBILITY,
  REACTION_TYPES,
  ROLES,
  SKILL_LEVELS,
} from "@/lib/constants";

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalUrl = () =>
  z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const registerSchema = z.object({
  name: text("Name", 2, 80),
  email: z.string().trim().email("Enter a valid email address."),
  password: text("Password", 8, 100),
  role: z.enum(ROLES).default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: text("Password", 1, 100),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: text("Token", 10, 500),
  password: text("Password", 8, 100),
});

export const profileSchema = z.object({
  name: text("Name", 2, 80),
  headline: optionalText(140),
  bio: optionalText(2000),
  location: optionalText(120),
  availability: optionalText(120),
  linkedinUrl: optionalUrl(),
  githubUrl: optionalUrl(),
  portfolioUrl: optionalUrl(),
  visibility: z.enum(PROFILE_VISIBILITY).default("PUBLIC"),
  openToOpportunities: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .default("false")
    .transform((value) => value === "on" || value === "true"),
});

export const skillSchema = z.object({
  name: text("Skill", 2, 60),
  level: z.enum(SKILL_LEVELS).default("Developing"),
  years: z.coerce.number().int().min(0).max(60).default(0),
});

export const existingSkillSchema = z.object({
  skillId: text("Skill", 1, 100),
  level: z.enum(SKILL_LEVELS).default("Developing"),
  years: z.coerce.number().int().min(0).max(60).default(0),
});

export const profileItemSchema = z.object({
  kind: z.enum(["QUALIFICATION", "EXPERIENCE", "PROJECT", "ACHIEVEMENT", "PORTFOLIO"]),
  title: text("Title", 2, 140),
  secondary: optionalText(140),
  description: optionalText(2000),
  url: optionalUrl(),
  date: optionalText(40),
  fileAssetId: optionalText(100),
});

export const connectionSchema = z.object({
  addresseeId: text("Member", 1, 100),
  message: optionalText(500),
});

export const connectionResponseSchema = z.object({
  connectionId: text("Connection", 1, 100),
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export const messageSchema = z.object({
  threadId: text("Conversation", 1, 100),
  body: text("Message", 1, 4000),
});

export const newThreadSchema = z.object({
  otherUserId: text("Member", 1, 100),
  body: text("Message", 1, 4000),
  companyId: optionalText(100),
});

export const postSchema = z.object({
  body: text("Post", 1, 5000),
  type: z.enum(POST_TYPES).default("UPDATE"),
  visibility: z.enum(PROFILE_VISIBILITY).default("PUBLIC"),
  companyId: optionalText(100),
  mediaIds: z.array(z.string()).max(6).default([]),
});

export const commentSchema = z.object({
  postId: text("Post", 1, 100),
  body: text("Comment", 1, 2000),
});

export const reactionSchema = z.object({
  postId: text("Post", 1, 100),
  type: z.enum(REACTION_TYPES).default("LIKE"),
});

export const reportSchema = z.object({
  postId: text("Post", 1, 100),
  reason: text("Reason", 3, 120),
  details: optionalText(1000),
});

export const companySchema = z.object({
  name: text("Company name", 2, 120),
  website: optionalUrl(),
  industry: optionalText(120),
  location: optionalText(120),
  description: optionalText(3000),
});

export const opportunitySchema = z.object({
  companyId: text("Company", 1, 100),
  title: text("Title", 3, 140),
  type: z.enum(OPPORTUNITY_TYPES).default("JOB"),
  location: optionalText(120),
  description: text("Description", 10, 5000),
  requirements: optionalText(3000),
  applicationUrl: optionalUrl(),
});

export const programSchema = z.object({
  title: text("Title", 3, 140),
  slug: text("Slug", 2, 100),
  summary: text("Summary", 10, 300),
  description: optionalText(5000),
  startDate: optionalText(40),
  endDate: optionalText(40),
});

export const cohortSchema = z.object({
  programId: text("Program", 1, 100),
  name: text("Cohort name", 2, 100),
  startDate: optionalText(40),
  endDate: optionalText(40),
  capacity: z.coerce.number().int().min(1).max(10000).default(100),
});

export const moduleSchema = z.object({
  programId: text("Program", 1, 100),
  title: text("Title", 2, 140),
  description: optionalText(2000),
  position: z.coerce.number().int().min(0).max(100).default(0),
});

export const sessionSchema = z.object({
  moduleId: text("Module", 1, 100),
  title: text("Title", 2, 140),
  description: optionalText(2000),
  content: optionalText(10000),
  position: z.coerce.number().int().min(0).max(100).default(0),
});

export const assignmentSchema = z.object({
  moduleId: text("Module", 1, 100),
  title: text("Title", 2, 140),
  description: text("Description", 5, 5000),
  dueAt: optionalText(40),
  maxScore: z.coerce.number().int().min(1).max(1000).default(100),
});

export const submissionSchema = z.object({
  assignmentId: text("Assignment", 1, 100),
  note: optionalText(2000),
  fileAssetId: optionalText(100),
});

export const gradeSchema = z.object({
  submissionId: text("Submission", 1, 100),
  score: z.coerce.number().int().min(0).max(1000),
  feedback: optionalText(2000),
});

export function formErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
