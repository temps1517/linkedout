import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Network,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: GraduationCap,
    title: "Profiles with evidence",
    description:
      "Showcase skills, qualifications, projects, achievements, and work portfolios in one professional home.",
  },
  {
    icon: Network,
    title: "Purposeful networking",
    description:
      "Connect students, trainers, and corporate partners around learning, opportunities, and real projects.",
  },
  {
    icon: Award,
    title: "Visible progress",
    description:
      "Track training, assignments, feedback, and completion in a structured dashboard built for growth.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Company integration",
    description:
      "Give partners a clear view of emerging talent while they share opportunities and engage with the community.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3 text-lg font-bold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          LinkedOut
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Join the community</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <Badge tone="blue">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Built for professional growth
          </Badge>
          <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight text-foreground">
            Where learning becomes a career story.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            LinkedOut brings students, trainers, and companies into one focused professional
            community. Share what you are learning, prove what you can do, and find the people
            who can help you go further.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">
                Create your profile <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted">
            Demo accounts are available after setup. See the README for credentials.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-200 to-teal-100 blur-2xl" />
          <div className="relative grid gap-4 rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                AO
              </span>
              <div>
                <p className="font-bold">Amara Okafor</p>
                <p className="text-sm text-muted">Final-year software engineering student</p>
              </div>
              <Badge tone="green" className="ml-auto">
                Open to work
              </Badge>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Professional Product Engineering</p>
                <Badge tone="blue">50% complete</Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 rounded-full bg-primary" />
              </div>
              <p className="mt-3 text-sm text-muted">
                Product brief analysis graded 88/100 · Case study in progress
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="font-semibold">Northstar Labs</p>
              <p className="mt-1 text-sm text-muted">
                Frontend Engineering Intern · Applications open
              </p>
              <div className="mt-3 flex gap-2">
                <Badge tone="teal">Internship</Badge>
                <Badge tone="neutral">Bristol / Hybrid</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            One platform, four outcomes
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold">
            Everything a growing professional needs, without the noise.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-border p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to make your progress visible?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Join a community where your work, learning, and achievements are understood in context.
        </p>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg">
            Get started <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </main>
  );
}
