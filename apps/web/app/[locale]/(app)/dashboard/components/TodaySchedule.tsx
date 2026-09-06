"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { formatCalendarDate } from "@/lib/date-formatters";
import type {
  ScheduledWorkout,
  ScheduledWorkoutsResponse,
} from "@/lib/scheduled-workouts";

function dateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function itemDate(item: ScheduledWorkout) {
  return item.scheduledDate.slice(0, 10);
}

function workoutHref(item: ScheduledWorkout) {
  return `/workouts/${item.workout.id}?variation=${encodeURIComponent(
    item.workoutVariant.level.key,
  )}#log-result` as const;
}

function WorkoutSummary({ item }: { item: ScheduledWorkout }) {
  const t = useTranslations("dashboard.schedule");
  const workoutTypeT = useTranslations("workoutTypes");
  const typeKey = item.workout.type.key.toLowerCase();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{item.workoutVariant.level.name}</Badge>
        {item.prescriptionCategory && (
          <Badge>{item.prescriptionCategory.name}</Badge>
        )}
        {item.workout.isBenchmark && <Badge>{t("benchmark")}</Badge>}
      </div>
      <h3 className="mt-4 break-words text-xl font-bold">
        {item.workout.name}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {workoutTypeT.has(typeKey)
          ? workoutTypeT(typeKey)
          : item.workout.type.name}
        {item.workoutVariant.name ? ` · ${item.workoutVariant.name}` : ""}
      </p>
      {item.notes && (
        <p className="mt-4 break-words text-sm text-muted">{item.notes}</p>
      )}
    </>
  );
}

type UpcomingCardProps = {
  item: ScheduledWorkout;
  onUpdated: (item: ScheduledWorkout) => void;
  onRemoved: (id: string) => void;
};

function UpcomingCard({ item, onUpdated, onRemoved }: UpcomingCardProps) {
  const t = useTranslations("dashboard.upcoming");
  const locale = useLocale();
  const [mode, setMode] = useState<"idle" | "date" | "remove">("idle");
  const [newDate, setNewDate] = useState(itemDate(item));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function closeActions() {
    setMode("idle");
    setNewDate(itemDate(item));
    setError(null);
  }

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/scheduled-workouts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: newDate }),
      });
      const data = (await response.json()) as ScheduledWorkout & {
        message?: string | string[];
      };

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        setError(
          response.status === 409
            ? t("duplicateError")
            : (message ?? t("rescheduleError")),
        );
        return;
      }

      onUpdated(data);
      setMode("idle");
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/scheduled-workouts/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(t("removeError"));
        return;
      }

      onRemoved(item.id);
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="min-w-0 p-5 sm:p-6">
      <p className="mb-4 text-sm font-semibold text-accent">
        {formatCalendarDate(itemDate(item), locale)}
      </p>
      <WorkoutSummary item={item} />

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      {mode === "date" && (
        <form onSubmit={reschedule} className="mt-5 border-t border-border pt-5">
          <label
            htmlFor={`reschedule-${item.id}`}
            className="mb-1.5 block text-sm font-medium"
          >
            {t("newDate")}
          </label>
          <input
            id={`reschedule-${item.id}`}
            type="date"
            required
            min={dateValue()}
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 sm:max-w-xs"
          />
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={closeActions}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={newDate === itemDate(item)}
              className="w-full sm:w-auto"
            >
              {submitting ? t("saving") : t("saveDate")}
            </Button>
          </div>
        </form>
      )}

      {mode === "remove" && (
        <div className="mt-5 border-t border-border pt-5">
          <p className="font-semibold">{t("removeTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("removeDescription")}</p>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={closeActions}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={submitting}
              onClick={remove}
              className="w-full sm:w-auto"
            >
              {submitting ? t("removing") : t("confirmRemove")}
            </Button>
          </div>
        </div>
      )}

      {mode === "idle" && (
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
          <ButtonLink href={workoutHref(item)} className="w-full sm:w-auto">
            {t("openWorkout")}
          </ButtonLink>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMode("date")}
            className="w-full sm:w-auto"
          >
            {t("reschedule")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode("remove")}
            className="w-full sm:w-auto"
          >
            {t("remove")}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function TodaySchedule() {
  const t = useTranslations("dashboard.schedule");
  const upcomingT = useTranslations("dashboard.upcoming");
  const [schedule, setSchedule] = useState<ScheduledWorkoutsResponse | null>(
    null,
  );
  const [error, setError] = useState(false);
  const today = dateValue();

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedule() {
      try {
        const query = new URLSearchParams({
          from: today,
          to: dateValue(addDays(new Date(), 30)),
          status: "PLANNED",
        });
        const response = await fetch(`/api/scheduled-workouts?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load schedule");
        }

        setSchedule((await response.json()) as ScheduledWorkoutsResponse);
      } catch (loadError) {
        if (!(loadError instanceof Error && loadError.name === "AbortError")) {
          setError(true);
        }
      }
    }

    void loadSchedule();
    return () => controller.abort();
  }, [today]);

  const items = schedule?.items ?? [];
  const todayItems = items.filter((item) => itemDate(item) === today);
  const upcomingItems = items.filter((item) => itemDate(item) > today);

  function updateItem(updated: ScheduledWorkout) {
    setSchedule((current) =>
      current
        ? {
            items: current.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          }
        : current,
    );
  }

  function removeItem(id: string) {
    setSchedule((current) =>
      current
        ? { items: current.items.filter((item) => item.id !== id) }
        : current,
    );
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="today-schedule-title">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>
        <h2 id="today-schedule-title" className="mt-2 text-2xl font-bold">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("description")}</p>

        {!schedule && !error && (
          <Card className="mt-5 p-6" aria-live="polite">
            <div className="h-5 w-2/3 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-5 h-11 w-full animate-pulse rounded bg-surface-elevated sm:w-40" />
            <span className="sr-only">{t("loading")}</span>
          </Card>
        )}

        {error && (
          <Card className="mt-5 p-6">
            <p className="font-semibold">{t("errorTitle")}</p>
            <p className="mt-2 text-sm text-muted">{t("errorDescription")}</p>
          </Card>
        )}

        {schedule && todayItems.length === 0 && (
          <Card className="mt-5 p-6 sm:p-8">
            <h3 className="text-xl font-bold">{t("emptyTitle")}</h3>
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

        {todayItems.length > 0 && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {todayItems.map((item) => (
              <Card key={item.id} className="flex min-w-0 flex-col p-5 sm:p-6">
                <div className="flex-1">
                  <WorkoutSummary item={item} />
                </div>
                <ButtonLink
                  href={workoutHref(item)}
                  className="mt-5 w-full sm:w-auto"
                >
                  {t("logResult")}
                </ButtonLink>
              </Card>
            ))}
          </div>
        )}
      </section>

      {schedule && (
        <section aria-labelledby="upcoming-title">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {upcomingT("eyebrow")}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="upcoming-title" className="mt-2 text-2xl font-bold">
                {upcomingT("title")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {upcomingT("description")}
              </p>
            </div>
            <ButtonLink href="/workouts" variant="secondary" size="sm">
              {upcomingT("scheduleAnother")}
            </ButtonLink>
          </div>

          {upcomingItems.length === 0 ? (
            <Card className="mt-5 p-6 text-center">
              <p className="font-semibold">{upcomingT("emptyTitle")}</p>
              <p className="mt-2 text-sm text-muted">
                {upcomingT("emptyDescription")}
              </p>
            </Card>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {upcomingItems.map((item) => (
                <UpcomingCard
                  key={item.id}
                  item={item}
                  onUpdated={updateItem}
                  onRemoved={removeItem}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
