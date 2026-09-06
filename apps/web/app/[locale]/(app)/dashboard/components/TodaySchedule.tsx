"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Badge from "@/components/ui/Badge";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import type { ScheduledWorkoutsResponse } from "@/lib/scheduled-workouts";

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TodaySchedule() {
  const t = useTranslations("dashboard.schedule");
  const workoutTypeT = useTranslations("workoutTypes");
  const [schedule, setSchedule] = useState<ScheduledWorkoutsResponse | null>(
    null,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const today = getLocalDateValue();

    async function loadSchedule() {
      try {
        const query = new URLSearchParams({
          from: today,
          to: today,
          status: "PLANNED",
        });
        const response = await fetch(`/api/scheduled-workouts?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load today's schedule");
        }

        setSchedule((await response.json()) as ScheduledWorkoutsResponse);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        setError(true);
      }
    }

    void loadSchedule();

    return () => controller.abort();
  }, []);

  const items = schedule?.items ?? [];

  return (
    <section aria-labelledby="today-schedule-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>
        <h2 id="today-schedule-title" className="mt-2 text-2xl font-bold">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t("description")}
        </p>
      </div>

      {!schedule && !error && (
        <Card className="mt-5 p-6" aria-live="polite">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-3 h-7 w-2/3 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-5 h-11 w-full animate-pulse rounded bg-surface-elevated sm:w-40" />
          <span className="sr-only">{t("loading")}</span>
        </Card>
      )}

      {error && (
        <Card className="mt-5 p-6">
          <p className="font-semibold">{t("errorTitle")}</p>
          <p className="mt-2 text-sm text-muted">{t("errorDescription")}</p>
          <ButtonLink href="/workouts" className="mt-5 w-full sm:w-auto">
            {t("browseWorkouts")}
          </ButtonLink>
        </Card>
      )}

      {schedule && items.length === 0 && (
        <Card className="mt-5 p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-bold text-accent">
            +
          </div>
          <h3 className="mt-4 text-xl font-bold">{t("emptyTitle")}</h3>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {t("emptyDescription")}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/workouts" className="w-full sm:w-auto">
              {t("chooseWorkout")}
            </ButtonLink>
            <ButtonLink
              href="/movements"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {t("logMovement")}
            </ButtonLink>
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const workoutTypeKey = item.workout.type.key.toLowerCase();
            const workoutTypeName = workoutTypeT.has(workoutTypeKey)
              ? workoutTypeT(workoutTypeKey)
              : item.workout.type.name;
            const href = `/workouts/${item.workout.id}?variation=${encodeURIComponent(
              item.workoutVariant.level.key,
            )}#log-result` as const;

            return (
              <Card key={item.id} className="flex min-w-0 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">
                    {item.workoutVariant.level.name}
                  </Badge>
                  {item.prescriptionCategory && (
                    <Badge>{item.prescriptionCategory.name}</Badge>
                  )}
                  {item.workout.isBenchmark && <Badge>{t("benchmark")}</Badge>}
                </div>

                <div className="mt-4 min-w-0 flex-1">
                  <h3 className="break-words text-xl font-bold">
                    {item.workout.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {workoutTypeName}
                    {item.workoutVariant.name
                      ? ` · ${item.workoutVariant.name}`
                      : ""}
                  </p>
                  {item.notes && (
                    <p className="mt-4 break-words text-sm text-muted">
                      {item.notes}
                    </p>
                  )}
                </div>

                <ButtonLink href={href} className="mt-5 w-full sm:w-auto">
                  {t("logResult")}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
