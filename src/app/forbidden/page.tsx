import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-danger">403</p>
        <h1 className="mt-3 text-2xl font-bold">You do not have access to this area.</h1>
        <p className="mt-3 text-sm text-muted">
          Your account may not have the right role for this page.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
