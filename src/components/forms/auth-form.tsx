"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  requestResetAction,
  resetPasswordAction,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ROLES } from "@/lib/constants";
import { emptyFormState } from "@/types";

type Mode = "login" | "register" | "forgot" | "reset";

const actions = {
  login: loginAction,
  register: registerAction,
  forgot: requestResetAction,
  reset: resetPasswordAction,
};

const copy: Record<Mode, { title: string; description: string; button: string }> = {
  login: {
    title: "Welcome back",
    description: "Sign in to continue your professional growth.",
    button: "Sign in",
  },
  register: {
    title: "Create your account",
    description: "Join a community built around learning and career progress.",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password",
    description: "We will send you a secure reset link.",
    button: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    description: "Use at least eight characters.",
    button: "Update password",
  },
};

export function AuthForm({ mode, token }: { mode: Mode; token?: string }) {
  const [state, formAction, pending] = useActionState(actions[mode], emptyFormState);
  const content = copy[mode];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
      <p className="mt-2 text-sm text-muted">{content.description}</p>

      <form action={formAction} className="mt-8 space-y-5">
        {mode === "reset" ? <input type="hidden" name="token" value={token ?? ""} /> : null}

        {mode === "register" ? (
          <Field label="Full name" error={state.fieldErrors?.name?.[0]}>
            <Input name="name" autoComplete="name" required />
          </Field>
        ) : null}

        {mode === "login" || mode === "register" || mode === "forgot" ? (
          <Field label="Email address" error={state.fieldErrors?.email?.[0]}>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
        ) : null}

        {mode === "login" || mode === "register" || mode === "reset" ? (
          <Field
            label={mode === "reset" ? "New password" : "Password"}
            hint={mode === "register" ? "At least 8 characters." : undefined}
            error={state.fieldErrors?.password?.[0]}
          >
            <Input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </Field>
        ) : null}

        {mode === "register" ? (
          <Field label="I am joining as" error={state.fieldErrors?.role?.[0]}>
            <Select name="role" defaultValue="STUDENT">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {state.message ? (
          <p
            aria-live="polite"
            className={`rounded-lg px-3 py-2 text-sm ${
              state.status === "error"
                ? "bg-red-50 text-red-800"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : content.button}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
        {mode === "login" ? (
          <>
            <Link className="font-semibold text-primary hover:underline" href="/register">
              Create an account
            </Link>
            <Link className="font-semibold text-primary hover:underline" href="/forgot-password">
              Forgot password?
            </Link>
          </>
        ) : (
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
