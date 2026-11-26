import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  url,
  size = "md",
  className,
}: {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };

  const safeUrl = url?.replace(/["()]/g, "");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-teal-600 font-bold text-white",
        sizes[size],
        className,
      )}
      style={safeUrl ? { backgroundImage: `url("${safeUrl}")` } : undefined}
      aria-label={name}
      role="img"
    >
      {safeUrl ? null : initials(name)}
    </span>
  );
}
