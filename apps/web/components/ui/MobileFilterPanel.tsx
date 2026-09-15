"use client";

import { type ReactNode, useEffect, useState } from "react";

import Button from "./Button";

type Props = {
  title: string;
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
  activeCount?: number;
};

export default function MobileFilterPanel({
  title,
  openLabel,
  closeLabel,
  children,
  activeCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="mt-6 w-full md:hidden"
        aria-expanded={open}
        aria-controls="mobile-filter-panel"
        onClick={() => setOpen(true)}
      >
        {openLabel}
        {activeCount > 0 ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <button
          type="button"
          aria-label={closeLabel}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="mobile-filter-panel"
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-labelledby="mobile-filter-title"
        className={[
          "z-50 bg-surface",
          open
            ? "fixed inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
            : "hidden",
          "md:static md:block md:max-h-none md:overflow-visible md:rounded-xl md:border md:border-border md:p-5 md:shadow-none",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between md:hidden">
          <h2 id="mobile-filter-title" className="text-lg font-bold">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
          >
            ×
          </Button>
        </div>
        {children}
        <Button
          type="button"
          className="sticky bottom-0 mt-5 w-full md:hidden"
          onClick={() => setOpen(false)}
        >
          {closeLabel}
        </Button>
      </aside>
    </>
  );
}
