"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  consumeAuthToken,
  createAuthToken,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { absoluteUrl, sendEmail } from "@/lib/email";
import { trackActivity } from "@/lib/notifications";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetRequestSchema,
  formErrors,
} from "@/lib/validation";
import type { FormState } from "@/types";

export async function registerAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      profile: {
        create: {
          name,
          visibility: "PUBLIC",
          openToOpportunities: true,
        },
      },
    },
    select: { id: true, email: true, name: true },
  });

  const token = await createAuthToken(user.id, "VERIFY_EMAIL");
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your LinkedOut email",
      text: `Hi ${user.name},\n\nVerify your email address: ${absoluteUrl(`/api/auth/verify?token=${token}`)}`,
    });
  } catch {
    console.warn("Verification email could not be sent during registration.");
  }

  await createSession(user.id);
  await trackActivity(user.id, "REGISTER", "USER", user.id);
  redirect("/dashboard?welcome=1");
}

export async function loginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email and password.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { status: "error", message: "Email or password is incorrect." };
  }

  await createSession(user.id);
  await trackActivity(user.id, "LOGIN", "USER", user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function verifyEmailAction(token: string) {
  const userId = await consumeAuthToken(token, "VERIFY_EMAIL");

  if (!userId) {
    redirect("/dashboard?verify=expired");
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });

  await trackActivity(userId, "EMAIL_VERIFIED", "USER", userId);
  redirect("/dashboard?verify=success");
}

export async function requestResetAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = await createAuthToken(user.id, "RESET_PASSWORD");
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your LinkedOut password",
        text: `Hi ${user.name},\n\nReset your password using this link: ${absoluteUrl(`/reset-password?token=${token}`)}\n\nThis link is valid for one hour.`,
      });
    } catch {
      console.warn("Password reset email could not be sent.");
    }
  }

  return {
    status: "success",
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: formErrors(parsed.error),
    };
  }

  const userId = await consumeAuthToken(parsed.data.token, "RESET_PASSWORD");

  if (!userId) {
    return { status: "error", message: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await db.session.deleteMany({ where: { userId } });
  await trackActivity(userId, "PASSWORD_RESET", "USER", userId);
  redirect("/login?reset=1");
}
