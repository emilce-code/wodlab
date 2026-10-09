export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-solid";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const baseClassName = [
  "inline-flex items-center justify-center gap-2 rounded-xl",
  "select-none text-sm font-semibold transition-colors motion-reduce:transition-none active:translate-y-px",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-strong disabled:hover:bg-accent",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-elevated",
  ghost: "text-muted hover:bg-surface-elevated hover:text-foreground",
  tertiary: "text-muted hover:bg-surface-elevated hover:text-foreground",
  danger:
    "border border-danger/40 bg-transparent text-danger hover:bg-danger/10",
  "danger-solid": "bg-danger-strong text-white hover:bg-danger-strong/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 sm:min-h-10",
  md: "min-h-12 px-4 py-3",
  lg: "min-h-14 px-5 py-4",
  icon: "relative h-11 w-11 shrink-0 p-0",
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [baseClassName, variants[variant], sizes[size], className].join(" ");
}
