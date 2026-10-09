"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const t = useTranslations("common");
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
          ) ?? [],
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/60 sm:mx-auto sm:max-w-md"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl px-3 text-sm text-accent"
        >
          {t("close")}
        </button>
      </div>
      {children}
    </dialog>
  );
}
