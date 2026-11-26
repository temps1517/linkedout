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
import { githubLoginError } from "@/lib/auth-errors";
import { ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
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

export function AuthForm({
  mode,
  token,
  error,
}: {
  mode: Mode;
  token?: string;
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(actions[mode], emptyFormState);
  const content = copy[mode];
  const oauthError = githubLoginError(error);
  const showGithub = mode === "login" || mode === "register";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
      <p className="mt-2 text-sm text-muted">{content.description}</p>

      {oauthError ? (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{oauthError}</p>
      ) : null}

      {showGithub ? (
        <>
          <a
            href="/api/auth/github"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-white px-6 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Continue with GitHub
          </a>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className={cn("space-y-5", showGithub ? "" : "mt-8")}>
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
