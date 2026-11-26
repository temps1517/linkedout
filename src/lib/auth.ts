import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role, SessionUser } from "@/types";

const SESSION_COOKIE = "linkedout_session";
const SESSION_DAYS = 30;

export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          profile: {
            select: { id: true, name: true, avatarUrl: true, headline: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    emailVerifiedAt: session.user.emailVerifiedAt,
    profile: session.user.profile
      ? {
          id: session.user.profile.id,
          name: session.user.profile.name,
          avatarUrl: session.user.profile.avatarUrl,
          headline: session.user.profile.headline,
        }
      : null,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function createAuthToken(userId: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  const token = generateToken();
  const hours = type === "VERIFY_EMAIL" ? 24 : 1;

  await db.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    },
  });

  return token;
}

export async function consumeAuthToken(
  token: string,
  type: "VERIFY_EMAIL" | "RESET_PASSWORD",
) {
  const record = await db.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (
    !record ||
    record.type !== type ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return null;
  }

  await db.authToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
