"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import type {
  LeaderboardPeriod,
  WorkoutLeaderboard,
  WorkoutLeaderboardEntry,
} from "@/lib/leaderboards";

const periods: LeaderboardPeriod[] = ["30D", "90D", "ALL"];

type Props = { workoutId: string; variantId: string };

export default function WorkoutLeaderboardCard({
  workoutId,
  variantId,
}: Props) {
  const t = useTranslations("workouts.detail.leaderboard");
  const locale = useLocale();
  const [period, setPeriod] = useState<LeaderboardPeriod>("30D");
  const [data, setData] = useState<WorkoutLeaderboard | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(
      `/api/leaderboards/workouts/${encodeURIComponent(workoutId)}?variantId=${encodeURIComponent(variantId)}&period=${period}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Leaderboard unavailable");
        setData((await response.json()) as WorkoutLeaderboard);
      })
      .catch((requestError: unknown) => {
        if (!(
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )) {
          setError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [period, variantId, workoutId]);

  function formatResult(entry: WorkoutLeaderboardEntry, type: string | null) {
    if (type === "TIME" && entry.timeSeconds !== null) {
      const minutes = Math.floor(entry.timeSeconds / 60);
      const seconds = entry.timeSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
    if (type === "ROUNDS_REPS") {
      return t("roundsReps", {
        rounds: entry.rounds ?? 0,
        reps: entry.reps ?? 0,
      });
    }
    if (type === "REPS") return t("reps", { count: entry.reps ?? 0 });
    if (type === "LOAD")
      return `${entry.load ?? 0} ${entry.weightUnit ?? "KG"}`;
    return "—";
  }

  return (
    <section className="mt-10" aria-labelledby="workout-leaderboard-title">
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("eyebrow")}
              </p>
              <h2
                id="workout-leaderboard-title"
                className="mt-1 text-xl font-bold"
              >
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-muted">{t("description")}</p>
            </div>
            {data?.currentAthleteRank ? (
              <div className="shrink-0 rounded-xl bg-accent/10 px-3 py-2 text-center">
                <span className="block text-xs font-semibold text-muted">
                  {t("yourRank")}
                </span>
                <span className="text-xl font-black text-accent">
                  #{data.currentAthleteRank}
                </span>
              </div>
            ) : null}
          </div>

          <div
            className="mt-4 grid grid-cols-3 gap-2"
            aria-label={t("periodLabel")}
          >
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={period === item}
                onClick={() => {
                  if (item === period) return;
                  setLoading(true);
                  setError(false);
                  setPeriod(item);
                }}
                className={[
                  "min-h-11 rounded-lg border px-2 text-sm font-semibold transition",
                  period === item
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-muted",
                ].join(" ")}
              >
                {t(`periods.${item}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6" aria-live="polite">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted">
              {t("loading")}
            </p>
          ) : null}
          {error ? <Alert variant="error">{t("error")}</Alert> : null}
          {!loading && !error && data && !data.participating ? (
            <Alert>
              <p className="font-semibold">{t("optInTitle")}</p>
              <p className="mt-1 text-sm">{t("optInDescription")}</p>
              <Link
                href="/account"
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent"
              >
                {t("managePrivacy")}
              </Link>
            </Alert>
          ) : null}
          {!loading && !error && data && data.entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("empty")}</p>
          ) : null}
          {!loading && !error && data && data.entries.length > 0 ? (
            <ol className="divide-y divide-border">
              {data.entries.slice(0, 20).map((entry) => (
                <li
                  key={`${entry.rank}-${entry.displayName}`}
                  className={[
                    "grid min-h-14 grid-cols-[2.25rem_1fr_auto] items-center gap-2 py-3",
                    entry.isCurrentAthlete ? "text-accent" : "",
                  ].join(" ")}
                >
                  <span className="text-center text-sm font-black">
                    #{entry.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {entry.displayName}
                      {entry.isCurrentAthlete ? ` · ${t("you")}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(entry.performedAt))}
                    </p>
                  </div>
                  <span className="pl-2 text-right font-black">
                    {formatResult(entry, data.resultTypeKey)}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
