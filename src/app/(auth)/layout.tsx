import type { ReactNode } from "react";
import { GraduationCap, ShieldCheck, Users } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#14213d] via-[#1d4ed8] to-[#0f766e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-5 w-5" />
          </span>
          LinkedOut
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Professional community
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-tight">
            Learn, build, and be seen by the right people.
          </h2>
          <p className="mt-5 text-lg text-white/80">
            One place for students, trainers, and companies to grow together through real work,
            shared knowledge, and visible progress.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <Users className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Network with purpose</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <GraduationCap className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Track training</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <ShieldCheck className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Show real evidence</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">Built for professional growth, not noise.</p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
