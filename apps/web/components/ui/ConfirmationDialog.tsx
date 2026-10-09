"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "./Button";
import BottomSheet from "./BottomSheet";

type ConfirmationRequest = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};
type PendingConfirmation = ConfirmationRequest & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmationDialog() {
  const t = useTranslations("common");
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const active = useRef<PendingConfirmation | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const confirm = useCallback((request: ConfirmationRequest) => {
    // Repeated triggers share the active decision and cannot replace its resolver.
    if (active.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      const next = { ...request, resolve };
      active.current = next;
      setPending(next);
    });
  }, []);
  const close = useCallback((confirmed: boolean) => {
    const current = active.current;
    active.current = null;
    setPending(null);
    current?.resolve(confirmed);
  }, []);
  useEffect(
    () => () => {
      active.current?.resolve(false);
      active.current = null;
    },
    [],
  );
  const dialog = pending ? (
    <BottomSheet
      role="alertdialog"
      title={pending.title ?? t("confirmTitle")}
      onClose={() => close(false)}
      initialFocusRef={cancelRef}
      descriptionId={descriptionId}
    >
      <p id={descriptionId} className="text-sm leading-relaxed text-muted">
        {pending.description}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          ref={cancelRef}
          type="button"
          variant="secondary"
          onClick={() => close(false)}
        >
          {pending.cancelLabel ?? t("cancel")}
        </Button>
        <Button
          type="button"
          variant={pending.danger === false ? "primary" : "danger"}
          className={
            pending.danger === false
              ? ""
              : "border-transparent! bg-red-700! text-white! hover:bg-red-800!"
          }
          onClick={() => close(true)}
        >
          {pending.confirmLabel ?? t("confirm")}
        </Button>
      </div>
    </BottomSheet>
  ) : null;
  return { confirm, dialog };
}
