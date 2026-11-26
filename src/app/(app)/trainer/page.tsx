import { requireRole } from "@/lib/auth";
import { listGradingQueue, listTrainerPrograms } from "@/data/training";
import { publishProgramAction } from "@/actions/training";
import { TrainingAdminForms } from "@/components/forms/training-admin-forms";
import { GradeForm } from "@/components/forms/grade-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Trainer workspace" };

export default async function TrainerPage() {
  const user = await requireRole(["TRAINER", "ADMIN"]);
  const [programs, queue] = await Promise.all([
    listTrainerPrograms(user),
    listGradingQueue(user),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Trainer workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold">Build and assess learning</h1>
        <p className="mt-2 text-muted">
          Create programmes, publish cohorts, deliver sessions, and grade learner submissions.
        </p>
      </div>

      <Card>
        <CardHeader title="Your programmes" description="Drafts are private until published." />
        <CardContent>
          {programs.length ? (
            <div className="space-y-3">
              {programs.map((program) => (
                <div key={program.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{program.title}</p>
                      <Badge tone={program.status === "PUBLISHED" ? "green" : "amber"}>
                        {program.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {program.cohorts.length} cohorts · {program.sessionCount} sessions ·{" "}
                      {program.assignmentCount} assignments ·{" "}
                      {program.cohorts.reduce((sum, cohort) => sum + cohort.enrolled, 0)} learners
                    </p>
                  </div>
                  {program.status === "DRAFT" ? (
                    <form action={publishProgramAction}>
                      <input type="hidden" name="programId" value={program.id} />
                      <Button type="submit" size="sm">
                        Publish
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No programmes yet. Create your first one below.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Grading queue"
          description={`${queue.length} submission${queue.length === 1 ? "" : "s"} waiting for feedback.`}
        />
        <CardContent>
          {queue.length ? (
            <div className="space-y-3">
              {queue.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{item.assignmentTitle}</p>
                      <p className="text-sm text-muted">
                        {item.learnerName} · {item.programTitle} / {item.moduleTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Submitted {formatDateTime(item.submittedAt)}
                      </p>
                    </div>
                    {item.file ? (
                      <a
                        href={`/api/files/${item.file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-primary"
                      >
                        Open {item.file.name}
                      </a>
                    ) : null}
                  </div>
                  {item.note ? (
                    <p className="prose-safe mt-3 rounded-lg bg-slate-50 p-3 text-sm text-muted">
                      {item.note}
                    </p>
                  ) : null}
                  <GradeForm submissionId={item.id} maxScore={item.maxScore} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing to grade"
              description="New learner submissions will appear here automatically."
            />
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-bold">Programme builder</h2>
        <TrainingAdminForms programs={programs} />
      </div>
    </div>
  );
}
