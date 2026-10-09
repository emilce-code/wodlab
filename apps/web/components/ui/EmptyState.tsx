import type { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 space-y-3 px-4 py-8 text-center ${className}`}>
      {icon ? (
        <div
          aria-hidden="true"
          className="mx-auto flex h-11 w-11 items-center justify-center text-muted"
        >
          {icon}
        </div>
      ) : null}
      <p className="break-words text-base font-bold">{title}</p>
      {description ? (
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="flex flex-wrap justify-center gap-3 pt-2">{action}</div>
      ) : null}
    </div>
  );
}
