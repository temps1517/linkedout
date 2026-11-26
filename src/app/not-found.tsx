import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold">We could not find that page.</h1>
        <p className="mt-3 text-muted">The link may be old, or the item may have been removed.</p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
