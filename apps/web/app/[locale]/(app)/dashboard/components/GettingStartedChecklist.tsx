"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  useClientReady,
  useLocalStorageFlag,
} from "@/hooks/use-local-storage-flag";

type Props = {
  userId: string;
  progress: {
    profileCompleted: boolean;
    preferencesConfigured: boolean;
    hasMovementResult: boolean;
    hasWorkoutResult: boolean;
    hasScheduledWorkout: boolean;
  };
};

const items = [
  { key: "profile", href: "/account", progressKey: "profileCompleted" },
  {
    key: "preferences",
    href: "/account",
    progressKey: "preferencesConfigured",
  },
  {
    key: "movement",
    href: "/movements",
    progressKey: "hasMovementResult",
  },
  { key: "workout", href: "/workouts", progressKey: "hasWorkoutResult" },
  {
    key: "schedule",
    href: "/training",
    progressKey: "hasScheduledWorkout",
  },
] as const;

export default function GettingStartedChecklist({ userId, progress }: Props) {
  const t = useTranslations("dashboard.onboarding");
  const ready = useClientReady();
  const [dismissed, setDismissed] = useLocalStorageFlag(
    `wodly:onboarding-checklist-dismissed:${userId}`,
  );
  const [expanded, setExpanded] = useState(true);
  const completed = items.filter((item) => progress[item.progressKey]).length;

  if (!ready || dismissed || completed === items.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/30 bg-accent/5">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls="getting-started-items"
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {t("eyebrow")}
          </span>
          <span className="mt-1 flex items-center justify-between gap-3">
            <span className="font-bold">{t("title")}</span>
            <span className="shrink-0 text-sm font-semibold text-accent">
              {t("progress", { completed, total: items.length })}
            </span>
          </span>
          <span className="mt-1 block text-sm text-muted">
            {t("description")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t("dismiss")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl text-muted transition hover:bg-background hover:text-foreground"
        >
          ×
        </button>
      </div>

      {expanded ? (
        <div id="getting-started-items" className="border-t border-accent/20 p-2">
          {items.map((item) => {
            const isComplete = progress[item.progressKey];

            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-background"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    isComplete
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted"
                  }`}
                >
                  {isComplete ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-semibold ${isComplete ? "text-muted line-through" : ""}`}
                  >
                    {t(`items.${item.key}.title`)}
                  </span>
                  {!isComplete ? (
                    <span className="block text-xs text-muted">
                      {t(`items.${item.key}.description`)}
                    </span>
                  ) : null}
                </span>
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
