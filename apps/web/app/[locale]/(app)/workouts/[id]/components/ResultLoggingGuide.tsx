"use client";

import { useTranslations } from "next-intl";

import {
  useClientReady,
  useLocalStorageFlag,
} from "@/hooks/use-local-storage-flag";

export default function ResultLoggingGuide() {
  const t = useTranslations("workouts.logResult.firstUse");
  const ready = useClientReady();
  const [dismissed, setDismissed] = useLocalStorageFlag(
    "wodly:result-logging-guide-dismissed",
  );

  if (!ready || dismissed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("dismiss")}
        onClick={() => setDismissed(true)}
        className="fixed inset-0 z-[60] cursor-default bg-black/50"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-logging-guide-title"
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-border bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(32rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {t("eyebrow")}
        </p>
        <h2 id="result-logging-guide-title" className="mt-1 text-xl font-bold">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-muted">{t("description")}</p>

        <ol className="mt-5 space-y-4">
          {["score", "movements", "details"].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  {t(`steps.${step}.title`)}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t(`steps.${step}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {t("action")}
        </button>
      </section>
    </>
  );
}
