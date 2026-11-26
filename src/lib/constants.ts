export const ROLES = ["STUDENT", "TRAINER", "COMPANY", "ADMIN"] as const;

export const POST_TYPES = [
  "UPDATE",
  "PROJECT",
  "ACHIEVEMENT",
  "OPPORTUNITY",
  "KNOWLEDGE",
] as const;

export const POST_TYPE_LABELS: Record<string, string> = {
  UPDATE: "Update",
  PROJECT: "Project",
  ACHIEVEMENT: "Achievement",
  OPPORTUNITY: "Opportunity",
  KNOWLEDGE: "Knowledge",
};

export const OPPORTUNITY_TYPES = ["JOB", "INTERNSHIP", "PROJECT", "MENTORSHIP"] as const;

export const SKILL_LEVELS = ["Beginner", "Developing", "Proficient", "Advanced", "Expert"] as const;

export const PROFILE_VISIBILITY = ["PUBLIC", "MEMBERS", "PRIVATE"] as const;

export const REACTION_TYPES = ["LIKE", "CELEBRATE", "INSIGHTFUL"] as const;

export const REACTION_LABELS: Record<string, string> = {
  LIKE: "Like",
  CELEBRATE: "Celebrate",
  INSIGHTFUL: "Insightful",
};
