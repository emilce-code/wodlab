import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const baseClassName = [
  "inline-flex items-center justify-center gap-2 rounded-lg",
  "text-sm font-semibold transition-colors",
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
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/15",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 py-2",
  md: "min-h-11 px-4 py-2.5",
  lg: "min-h-12 px-5 py-3",
  icon: "h-11 w-11 shrink-0 p-0",
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

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}

      {children}
    </button>
  );
}
