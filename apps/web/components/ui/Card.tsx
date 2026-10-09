import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  elevated?: boolean;
};

export default function Card({
  children,
  className = "",
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "min-w-0 rounded-xl border border-border",
        elevated ? "bg-surface-elevated" : "bg-surface",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
