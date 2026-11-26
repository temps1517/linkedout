export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const safe = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted">{label}</span>
          <span className="text-foreground">{safe}%</span>
        </div>
      ) : null}
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
