export function getFormControlClassName({
  invalid = false,
  className = "",
}: { invalid?: boolean; className?: string } = {}) {
  return [
    "min-h-12! w-full min-w-0 rounded-xl border bg-surface px-3 py-2.5 text-base text-foreground outline-none transition-colors motion-reduce:transition-none",
    "placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-muted disabled:opacity-100 read-only:text-muted",
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
      : "border-border focus:border-accent focus:ring-2 focus:ring-accent/15",
    className,
  ].join(" ");
}
