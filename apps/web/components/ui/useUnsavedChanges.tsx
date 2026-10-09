"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useConfirmationDialog } from "./ConfirmationDialog";

// Use confirmDiscard for in-page context switches. Native beforeunload remains
// necessary when the browser is closing; browsers control its wording and UI.
export default function useUnsavedChanges({
  dirty,
  pending = false,
  message,
}: {
  dirty: boolean;
  pending?: boolean;
  message: string;
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const { confirm, dialog } = useConfirmationDialog();
  const leaving = useRef(false);
  const confirmDiscard = useCallback(async () => {
    if (pending) return false;
    if (!dirty) return true;
    return confirm({
      title: t("unsavedTitle"),
      description: message,
      cancelLabel: t("stay"),
      confirmLabel: t("discard"),
      danger: true,
    });
  }, [confirm, dirty, message, pending, t]);
  useEffect(() => {
    if (!dirty && !pending) return;
    function unload(event: BeforeUnloadEvent) {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function navigate(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href);
      if (
        url.href === location.href ||
        (url.pathname === location.pathname &&
          url.search === location.search &&
          url.hash)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void confirmDiscard().then((discard) => {
        if (!discard) return;
        if (url.origin === location.origin)
          router.push(url.pathname + url.search + url.hash);
        else {
          leaving.current = true;
          location.assign(url.href);
        }
      });
    }
    const navigation = (
      window as unknown as {
        navigation?: EventTarget & { traverseTo: (key: string) => unknown };
      }
    ).navigation;
    function traverse(event: Event) {
      const next = event as Event & {
        navigationType?: string;
        destination?: { key: string };
      };
      if (
        leaving.current ||
        next.navigationType !== "traverse" ||
        !event.cancelable ||
        !next.destination
      )
        return;
      event.preventDefault();
      void confirmDiscard().then((discard) => {
        if (!discard) return;
        leaving.current = true;
        navigation?.traverseTo(next.destination!.key);
      });
    }
    navigation?.addEventListener("navigate", traverse);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      navigation?.removeEventListener("navigate", traverse);
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [confirmDiscard, dirty, pending, router]);
  return { confirmDiscard, dialog };
}
