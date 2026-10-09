import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-solid";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

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

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={getButtonClassName({
        variant,
        size,
        className: `relative ${className}`,
      })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}

      <span
        className={`inline-flex items-center justify-center gap-2 ${isLoading ? "opacity-0" : ""}`}
      >
        {children}
      </span>
    </button>
  );
});

export default Button;
