import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
        </div>
        {icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
