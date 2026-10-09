"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import BoxDetailsIcon from "./BoxDetailsIcon";

export default function BottomSheet({
  title,
  onClose,
  children,
  desktopPanel = false,
  initialFocusRef,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  desktopPanel?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const t = useTranslations("common");
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    initialFocusRef?.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [initialFocusRef]);
  return (
    <dialog
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
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
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-border/60 bg-surface p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/60 sm:mx-auto sm:max-w-md ${desktopPanel ? "lg:inset-y-4 lg:left-auto lg:right-4 lg:m-0 lg:max-h-[calc(100dvh-2rem)] lg:w-96 lg:rounded-2xl lg:pb-4" : "md:inset-0 md:m-auto md:h-fit md:max-w-lg md:rounded-2xl md:pb-4"}`}
    >
      <div
        aria-hidden="true"
        className={`mx-auto mb-4 h-1 w-10 rounded-full bg-muted/40 ${desktopPanel ? "lg:hidden" : "md:hidden"}`}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id={titleId}
          className="min-w-0 break-words text-base font-semibold tracking-tight"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-foreground active:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        >
          <BoxDetailsIcon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
