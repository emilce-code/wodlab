"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Wordmark from "@/components/brand/Wordmark";

const CONNECTING_DELAY_MS = 3_500;
const SLOW_START_DELAY_MS = 10_000;

type StartupPhase = "restoring" | "connecting" | "slow";

export default function AppStartupScreen() {
  const t = useTranslations("states.startup");
  const [phase, setPhase] = useState<StartupPhase>("restoring");

  useEffect(() => {
    const connectingTimer = window.setTimeout(
      () => setPhase("connecting"),
      CONNECTING_DELAY_MS,
    );
    const slowStartTimer = window.setTimeout(
      () => setPhase("slow"),
      SLOW_START_DELAY_MS,
    );

    return () => {
      window.clearTimeout(connectingTimer);
      window.clearTimeout(slowStartTimer);
    };
  }, []);

  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-background px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="rounded-3xl border border-border bg-surface px-8 py-7 shadow-2xl shadow-black/10">
          <Wordmark className="justify-center text-3xl" />

          <div
            aria-hidden="true"
            className="mx-auto mt-8 flex items-center justify-center gap-2"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:160ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:320ms]" />
          </div>

          <p className="mt-5 text-base font-bold">{t(`${phase}.title`)}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(`${phase}.description`)}
          </p>

          {phase === "slow" ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition hover:border-accent/60 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {t("tagline")}
        </p>
      </div>
    </main>
  );
}
