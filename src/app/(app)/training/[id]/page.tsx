import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgram } from "@/data/training";
import {
  completeSessionAction,
  enrollAction,
} from "@/actions/training";
import { SubmissionForm } from "@/components/forms/submission-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Programme" };

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const program = await getProgram(id, user);
  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Learning programme
          </p>
          <h1 className="mt-2 text-3xl font-bold">{program.title}</h1>
          <p className="mt-2 max-w-3xl text-muted">{program.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={program.status === "PUBLISHED" ? "green" : "amber"}>
              {program.status.toLowerCase()}
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" /> {program.trainerName}
            </span>
            <span>
              {program.startDate ?? "Flexible"} – {program.endDate ?? "ongoing"}
            </span>
          </div>
        </div>
        {program.canManage ? (
          <Link href="/trainer">
            <Button variant="outline">
              <ClipboardCheck className="h-4 w-4" /> Trainer workspace
            </Button>
          </Link>
        ) : null}
      </div>

      {program.description ? (
        <Card>
          <CardHeader title="About this programme" />
          <CardContent>
            <p className="prose-safe whitespace-pre-line text-sm leading-relaxed text-muted">
              {program.description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {program.enrollment ? (
            <Card>
              <CardHeader
                title="Your progress"
                description={program.enrollment.completedAt ? "Programme complete." : "Keep going."}
              />
              <CardContent>
                <ProgressBar value={program.enrollment.progress} label="Completion" />
                {program.enrollment.certificate ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <Award className="h-6 w-6 text-emerald-700" />
                    <div>
                      <p className="font-bold text-emerald-900">Certificate issued</p>
                      <p className="text-xs text-emerald-800">
                        Verification code: {program.enrollment.certificate.verificationCode}
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Join a cohort" description="Enrol to unlock sessions and assignments." />
              <CardContent className="space-y-3">
                {program.cohorts.length ? (
                  program.cohorts.map((cohort) => {
                    const full = cohort.capacity ? cohort.enrolled >= cohort.capacity : false;
                    return (
                      <div key={cohort.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{cohort.name}</p>
                          <p className="text-xs text-muted">
                            {cohort.enrolled}/{cohort.capacity ?? "∞"} enrolled · {cohort.startDate ?? "Flexible"}
                          </p>
                        </div>
                        {program.status === "PUBLISHED" && !full ? (
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
              </CardContent>
            </Card>
          )}

          {program.modules.length ? (
            program.modules.map((module, index) => (
              <Card key={module.id}>
                <CardHeader
                  title={`${index + 1}. ${module.title}`}
                  description={module.description ?? undefined}
                />
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm font-bold">Learning sessions</p>
                    {module.sessions.length ? (
                      module.sessions.map((session) => (
                        <div key={session.id} className="rounded-xl border border-border p-3">
                          <div className="flex flex-wrap items-start gap-3">
                            <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{session.title}</p>
                              {session.description ? (
                                <p className="text-sm text-muted">{session.description}</p>
                              ) : null}
                              {session.content ? (
                                <details className="mt-2 text-sm">
                                  <summary className="cursor-pointer font-semibold text-primary">
                                    Open session material
                                  </summary>
                                  <p className="prose-safe mt-2 whitespace-pre-line text-muted">
                                    {session.content}
                                  </p>
                                </details>
                              ) : null}
                            </div>
                            {program.enrollment ? (
                              session.completed ? (
                                <Badge tone="green">
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                                </Badge>
                              ) : (
                                <form action={completeSessionAction}>
                                  <input type="hidden" name="sessionId" value={session.id} />
                                  <Button type="submit" size="sm" variant="outline">
                                    Mark complete
                                  </Button>
                                </form>
                              )
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">No sessions added yet.</p>
                    )}
                  </div>

                  {module.assignments.length ? (
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-sm font-bold">Assignments</p>
                      {module.assignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-xl border border-border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{assignment.title}</p>
                              <p className="prose-safe mt-1 text-sm text-muted">{assignment.description}</p>
                              <p className="mt-2 text-xs text-muted">
                                Due {assignment.dueAt ?? "flexible"} · Max {assignment.maxScore}
                              </p>
                            </div>
                            {assignment.submission?.grade ? (
                              <Badge tone="green">
                                {assignment.submission.grade.score}/{assignment.maxScore}
                              </Badge>
                            ) : assignment.submission ? (
                              <Badge tone="blue">{assignment.submission.status}</Badge>
                            ) : null}
                          </div>

                          {assignment.submission?.grade?.feedback ? (
                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-muted">
                              <span className="font-semibold">Feedback:</span>{" "}
                              {assignment.submission.grade.feedback}
                            </p>
                          ) : null}

                          {program.enrollment ? (
                            <div className="mt-3">
                              <SubmissionForm
                                assignmentId={assignment.id}
                                currentFile={assignment.submission?.file}
                              />
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-muted">
                              Enrol in a cohort to submit this assignment.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState title="No modules yet" description="The trainer has not added modules to this programme." />
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="At a glance" />
            <CardContent className="space-y-3 text-sm text-muted">
              <p className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {program.modules.length} modules
              </p>
              <p className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-primary" />
                {program.modules.reduce((sum, module) => sum + module.sessions.length, 0)} sessions
              </p>
              <p className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                {program.modules.reduce((sum, module) => sum + module.assignments.length, 0)} assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Certification" />
            <CardContent>
              <p className="text-sm leading-relaxed text-muted">
                Complete every session and pass every assignment to receive a certificate with a public
                verification code.
              </p>
              {program.enrollment?.certificate ? (
                <p className="mt-3 text-xs font-semibold text-emerald-700">
                  Issued {formatDateTime(program.enrollment.certificate.issuedAt)}
                </p>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  Progress: {program.enrollment?.progress ?? 0}% · Started{" "}
                  {formatDate(program.enrollment?.completedAt ?? null)}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
