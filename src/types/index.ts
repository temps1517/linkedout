export type Role = "STUDENT" | "TRAINER" | "COMPANY" | "ADMIN";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const emptyFormState: FormState = { status: "idle" };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerifiedAt: Date | null;
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string | null;
  } | null;
};

export type ConnectionStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";

export type PostType = "UPDATE" | "PROJECT" | "ACHIEVEMENT" | "OPPORTUNITY" | "KNOWLEDGE";
