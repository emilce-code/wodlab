import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  );
}

export default function LoadingState({
  label,
  children,
  className = "",
}: {
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`min-w-0 space-y-3 py-4 ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {children ?? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
