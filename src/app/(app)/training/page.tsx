import Link from "next/link";
import { CalendarDays, GraduationCap, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listPrograms } from "@/data/training";
import { enrollAction } from "@/actions/training";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  const user = await requireUser();
  const programs = await listPrograms(user);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Learning & development
        </p>
        <h1 className="mt-2 text-3xl font-bold">Training programmes</h1>
        <p className="mt-2 text-muted">
          Join a cohort, work through modules, submit assignments, and earn a verified certificate.
        </p>
      </div>

      {programs.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {programs.map((program) => {
            return (
              <Card key={program.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={program.status === "PUBLISHED" ? "green" : "amber"}>
                      {program.status.toLowerCase()}
                    </Badge>
                    <Badge>{program.sessionCount} sessions</Badge>
                    <Badge>{program.assignmentCount} assignments</Badge>
                  </div>

                  <h2 className="mt-4 text-xl font-bold">{program.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{program.summary}</p>

                  <div className="mt-4 grid gap-2 text-sm text-muted">
                    <p className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" /> Led by {program.trainerName}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {program.startDate ?? "Flexible"} – {program.endDate ?? "ongoing"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-border pt-4">
                    {program.cohorts.length ? (
                      program.cohorts.map((cohort) => {
                        const full = cohort.capacity ? cohort.enrolled >= cohort.capacity : false;
                        return (
                          <div
                            key={cohort.id}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">{cohort.name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted">
                                <Users className="h-3 w-3" /> {cohort.enrolled}
                                {cohort.capacity ? ` / ${cohort.capacity}` : ""} enrolled
                              </p>
                            </div>
                            {cohort.isEnrolled ? (
                              <Badge tone="green">Enrolled</Badge>
                            ) : program.status === "PUBLISHED" && !full ? (
                              <form action={enrollAction}>
                                <input type="hidden" name="cohortId" value={cohort.id} />
                                <Button type="submit" size="sm">
                                  Enrol
                                </Button>
                              </form>
                            ) : (
                              <Badge tone="neutral">{full ? "Full" : "Not open"}</Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">No cohorts scheduled yet.</p>
                    )}
                  </div>

                  <Link href={`/training/${program.id}`} className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      View programme
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No programmes available"
          description="Published programmes will appear here. Trainers can create them from the trainer workspace."
        />
      )}
    </div>
  );
}
