"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Button from "./Button";

type ConfirmationRequest = {
  title?: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
};

type PendingConfirmation = ConfirmationRequest & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmationDialog() {
  const t = useTranslations("common");
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (request: ConfirmationRequest) =>
      new Promise<boolean>((resolve) => setPending({ ...request, resolve })),
    [],
  );

  const close = useCallback((confirmed: boolean) => {
    setPending((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, pending]);

  const dialog = pending ? (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("cancel")}
        className="absolute inset-0 bg-black/60"
        onClick={() => close(false)}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="relative w-full rounded-t-2xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <h2 id="confirmation-dialog-title" className="text-xl font-bold">
          {pending.title ?? t("confirmTitle")}
        </h2>
        <p
          id="confirmation-dialog-description"
          className="mt-2 text-sm leading-6 text-muted"
        >
          {pending.description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={() => close(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={pending.danger === false ? "primary" : "danger"}
            onClick={() => close(true)}
          >
            {pending.confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </section>
    </div>
  ) : null;

  return { confirm, dialog };
}
