import type { ReactNode } from "react";

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <header
      className={[
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-muted">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
