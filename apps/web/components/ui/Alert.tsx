import type { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "error" | "info" | "success" | "warning";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: AlertVariant;
};

const variants: Record<AlertVariant, string> = {
  error: "border-red-400/30 bg-red-400/5 text-red-400",
  info: "border-blue-400/25 bg-blue-400/5 text-blue-300",
  warning: "border-amber-400/30 bg-amber-400/5 text-amber-300",
  success: "border-accent/30 bg-accent/10 text-accent",
};

export default function Alert({
  children,
  variant = "info",
  className = "",
  role,
  ...props
}: AlertProps) {
  return (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={[
        "min-w-0 break-words rounded-xl border px-4 py-3 text-sm",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
