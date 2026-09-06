"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { formatCalendarDate } from "@/lib/date-formatters";
import {
  calendarDays,
  monthRange,
  type ScheduledWorkout,
  type ScheduledWorkoutsResponse,
  type TrainingCalendarWorkout,
  toDateValue,
} from "@/lib/scheduled-workouts";

type ViewMode = "calendar" | "agenda";

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

const levelOrder = ["BEGINNER", "INTERMEDIATE", "RX"];

function orderedVariants(
  workout: TrainingCalendarWorkout,
  preferredLevelKey: string | null,
) {
  return workout.variants.toSorted((left, right) => {
    if (left.level.key === preferredLevelKey) return -1;
    if (right.level.key === preferredLevelKey) return 1;
    const leftIndex = levelOrder.indexOf(left.level.key.toUpperCase());
    const rightIndex = levelOrder.indexOf(right.level.key.toUpperCase());
    return (leftIndex < 0 ? levelOrder.length : leftIndex) -
      (rightIndex < 0 ? levelOrder.length : rightIndex);
  });
}

function workoutHref(item: ScheduledWorkout) {
  const anchor = item.status === "COMPLETED" ? "performance" : "log-result";
  const schedule =
    item.status === "PLANNED"
      ? `&scheduledWorkout=${encodeURIComponent(item.id)}`
      : "";
  return `/workouts/${item.workout.id}?variation=${encodeURIComponent(
    item.workoutVariant.level.key,
  )}${schedule}#${anchor}` as const;
}

function ScheduleSummary({ item }: { item: ScheduledWorkout }) {
  const t = useTranslations("training");

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={item.status === "COMPLETED" ? "accent" : "default"}>
          {item.status === "COMPLETED" ? t("completed") : t("planned")}
        </Badge>
        <Badge>{item.workoutVariant.level.name}</Badge>
        {item.prescriptionCategory ? (
          <Badge>{item.prescriptionCategory.name}</Badge>
        ) : null}
      </div>
      <h3 className="mt-3 break-words text-lg font-bold">{item.workout.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {item.workout.type.name}
        {item.workoutVariant.name ? ` · ${item.workoutVariant.name}` : ""}
      </p>
      {item.assignedByCoachProfile ? (
        <p className="mt-2 text-sm font-semibold text-accent">
          {t("assignedBy", {
            coach: item.assignedByCoachProfile.displayName,
          })}
        </p>
      ) : null}
      {item.coachNotes ? (
        <p className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm">
          {item.coachNotes}
        </p>
      ) : null}
      {item.coachFeedback ? (
        <p className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
          <span className="font-semibold">{t("coachFeedback")}</span>{" "}
          {item.coachFeedback}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-3 break-words text-sm text-muted">{item.notes}</p>
      ) : null}
    </div>
  );
}

type SessionActionsProps = {
  item: ScheduledWorkout;
  onUpdated: (item: ScheduledWorkout) => void;
  onRemoved: (id: string) => void;
};

function SessionActions({ item, onUpdated, onRemoved }: SessionActionsProps) {
  const t = useTranslations("training");
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(item.scheduledDate.slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (item.status === "COMPLETED") {
    return (
      <ButtonLink href={workoutHref(item)} variant="secondary" size="sm">
        {t("viewResult")}
      </ButtonLink>
    );
  }

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/scheduled-workouts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: date }),
      });
      const data = (await response.json()) as ScheduledWorkout & {
        message?: string | string[];
      };

      if (!response.ok) {
        setError(response.status === 409 ? t("duplicateError") : t("saveError"));
        return;
      }

      onUpdated(data);
      setEditing(false);
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("removeConfirm"))) return;
    setSubmitting(true);
    setError(null);

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
    <div className="mt-4 border-t border-border pt-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {editing ? (
        <form onSubmit={reschedule} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor={`session-date-${item.id}`}>
            {t("date")}
          </label>
          <input
            id={`session-date-${item.id}`}
            type="date"
            required
            min={toDateValue(new Date())}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-accent"
          />
          <Button type="submit" size="sm" isLoading={submitting}>
            {t("save")}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={workoutHref(item)} size="sm">
            {t("openWorkout")}
          </ButtonLink>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
            {t("reschedule")}
          </Button>
          <Button type="button" size="sm" variant="ghost" isLoading={submitting} onClick={remove}>
            {t("remove")}
          </Button>
        </div>
      )}
    </div>
  );
}

type ScheduleFormProps = {
  date: string;
  workouts: TrainingCalendarWorkout[];
  preferredLevelKey: string | null;
  onSaved: (item: ScheduledWorkout) => void;
  onClose: () => void;
};

function ScheduleForm({
  date,
  workouts,
  preferredLevelKey,
  onSaved,
  onClose,
}: ScheduleFormProps) {
  const t = useTranslations("training");
  const locale = useLocale();
  const [workoutId, setWorkoutId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const workout = workouts.find((item) => item.id === workoutId);

  function selectWorkout(id: string) {
    const selected = workouts.find((item) => item.id === id);
    setWorkoutId(id);
    setVariantId(
      selected ? (orderedVariants(selected, preferredLevelKey)[0]?.id ?? "") : "",
    );
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workoutId || !variantId) {
      setError(t("selectionRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/scheduled-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          workoutVariantId: variantId,
          scheduledDate: date,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      const data = (await response.json()) as ScheduledWorkout & {
        message?: string | string[];
      };
      if (!response.ok) {
        setError(response.status === 409 ? t("duplicateError") : t("saveError"));
        return;
      }
      onSaved(data);
      onClose();
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t("scheduleEyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-bold">
            {t("scheduleFor", { date: formatCalendarDate(date, locale) })}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t("close")} className="h-11 w-11 rounded-lg text-xl text-muted hover:bg-surface-elevated">
          ×
        </button>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="calendar-workout" className="mb-1.5 block text-sm font-medium">{t("workout")}</label>
          <select id="calendar-workout" value={workoutId} onChange={(event) => selectWorkout(event.target.value)} className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-accent">
            <option value="">{t("selectWorkout")}</option>
            {workouts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        {workout && workout.variants.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-medium">{t("variation")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {orderedVariants(workout, preferredLevelKey).map((variant) => (
                <button key={variant.id} type="button" aria-pressed={variantId === variant.id} onClick={() => setVariantId(variant.id)} className={["min-h-11 rounded-full border px-4 text-sm font-semibold", variantId === variant.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted"].join(" ")}>
                  {variant.level.name}{variant.name ? ` · ${variant.name}` : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div>
          <label htmlFor="calendar-notes" className="mb-1.5 block text-sm font-medium">{t("notesOptional")}</label>
          <textarea id="calendar-notes" rows={3} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent" />
        </div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">{t("cancel")}</Button>
          <Button type="submit" isLoading={submitting} className="w-full sm:w-auto">{t("addToPlan")}</Button>
        </div>
      </form>
    </Card>
  );
}

export default function TrainingCalendar() {
  const t = useTranslations("training");
  const locale = useLocale();
  const today = toDateValue(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [view, setView] = useState<ViewMode>("calendar");
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [workouts, setWorkouts] = useState<TrainingCalendarWorkout[]>([]);
  const [preferredLevelKey, setPreferredLevelKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [calendarActionError, setCalendarActionError] = useState<string | null>(
    null,
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { from, to } = monthRange(month);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const query = new URLSearchParams({ from, to });
        const [scheduleResponse, workoutsResponse, profileResponse] = await Promise.all([
          fetch(`/api/scheduled-workouts?${query}`, { signal: controller.signal }),
          fetch("/api/workouts", { signal: controller.signal }),
          fetch("/api/athlete-profile", { signal: controller.signal }),
        ]);
        if (!scheduleResponse.ok || !workoutsResponse.ok || !profileResponse.ok) throw new Error("load");
        const scheduleData = (await scheduleResponse.json()) as ScheduledWorkoutsResponse;
        setSchedule(scheduleData.items);
        setWorkouts((await workoutsResponse.json()) as TrainingCalendarWorkout[]);
        const profile = (await profileResponse.json()) as {
          preferredWorkoutLevel?: { key: string } | null;
        };
        setPreferredLevelKey(profile.preferredWorkoutLevel?.key ?? null);
      } catch (loadError) {
        if (!(loadError instanceof Error && loadError.name === "AbortError")) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [from, to]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduledWorkout[]>();
    for (const item of schedule) {
      const key = item.scheduledDate.slice(0, 10);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [schedule]);
  const days = calendarDays(month);
  const weekdayNames = Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2026, 7, 2 + day)),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);

  function upsert(item: ScheduledWorkout) {
    setSchedule((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item];
    });
  }

  async function removeFromCalendar(item: ScheduledWorkout) {
    if (!window.confirm(t("removeConfirm"))) {
      return;
    }

    setRemovingId(item.id);
    setCalendarActionError(null);

    try {
      const response = await fetch(`/api/scheduled-workouts/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setCalendarActionError(t("removeError"));
        return;
      }

      setSchedule((current) =>
        current.filter((entry) => entry.id !== item.id),
      );
    } catch {
      setCalendarActionError(t("connectionError"));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button type="button" variant="secondary" size="sm" onClick={() => setMonth(addMonths(month, -1))} aria-label={t("previousMonth")}>←</Button>
          <h2 className="min-w-0 text-center text-lg font-bold capitalize sm:min-w-48">{monthLabel}</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setMonth(addMonths(month, 1))} aria-label={t("nextMonth")}>→</Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>{t("today")}</Button>
          <Button type="button" size="sm" variant={view === "calendar" ? "primary" : "secondary"} onClick={() => setView("calendar")} aria-pressed={view === "calendar"}>{t("calendarView")}</Button>
          <Button type="button" size="sm" variant={view === "agenda" ? "primary" : "secondary"} onClick={() => setView("agenda")} aria-pressed={view === "agenda"}>{t("agendaView")}</Button>
        </div>
      </div>

      {error ? <Alert variant="error" className="mt-5">{t("loadError")}</Alert> : null}
      {calendarActionError ? (
        <Alert variant="error" className="mt-5">
          {calendarActionError}
        </Alert>
      ) : null}
      {loading ? <Card className="mt-5 p-8 text-center text-muted">{t("loading")}</Card> : null}

      {!loading && !error && view === "calendar" ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-7 border-b border-border bg-surface-elevated">
            {weekdayNames.map((name) => <div key={name} className="px-1 py-3 text-center text-xs font-semibold uppercase text-muted">{name}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date) => {
              const value = toDateValue(date);
              const items = itemsByDate.get(value) ?? [];
              const currentMonth = date.getMonth() === month.getMonth();
              return (
                <div
                  key={value}
                  className={[
                    "min-h-24 min-w-0 border-b border-r border-border p-1.5 transition sm:min-h-32 sm:p-2",
                    currentMonth ? "" : "bg-background/40 text-muted",
                    value === today ? "ring-2 ring-inset ring-accent" : "",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDate(value)}
                    aria-label={t("selectDate", {
                      date: formatCalendarDate(value, locale),
                      count: items.length,
                    })}
                    className="w-full rounded text-left text-sm font-semibold hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {date.getDate()}
                  </button>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={[
                          "flex min-w-0 items-center rounded",
                          item.status === "COMPLETED"
                            ? "bg-accent/10 text-accent"
                            : "bg-surface-elevated text-foreground",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDate(value)}
                          title={item.workout.name}
                          className="min-h-7 min-w-0 flex-1 truncate px-1 text-left text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:px-1.5 sm:text-xs"
                        >
                          {item.workout.name}
                        </button>
                        {item.status === "PLANNED" ? (
                          <button
                            type="button"
                            disabled={removingId === item.id}
                            onClick={() => void removeFromCalendar(item)}
                            aria-label={t("removeWorkout", {
                              workout: item.workout.name,
                            })}
                            title={t("removeWorkout", {
                              workout: item.workout.name,
                            })}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted transition hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-40"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {items.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(value)}
                        className="block text-[10px] text-muted hover:text-foreground"
                      >
                        +{items.length - 2}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && !error && view === "agenda" ? (
        <div className="mt-5 space-y-4">
          {schedule.length === 0 ? <Card className="p-8 text-center text-muted">{t("emptyMonth")}</Card> : schedule.map((item) => (
            <Card key={item.id} className="p-5 sm:p-6">
              <p className="mb-4 text-sm font-semibold text-accent">{formatCalendarDate(item.scheduledDate.slice(0, 10), locale)}</p>
              <ScheduleSummary item={item} />
              <SessionActions item={item} onUpdated={upsert} onRemoved={(id) => setSchedule((current) => current.filter((entry) => entry.id !== id))} />
            </Card>
          ))}
        </div>
      ) : null}

      {selectedDate ? (
        <div className="mt-6 scroll-mt-6" id="selected-training-day">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t("selectedDay")}</p>
              <h2 className="mt-1 text-2xl font-bold">{formatCalendarDate(selectedDate, locale)}</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(itemsByDate.get(selectedDate) ?? []).map((item) => (
              <Card key={item.id} className="p-5">
                <ScheduleSummary item={item} />
                <SessionActions item={item} onUpdated={upsert} onRemoved={(id) => setSchedule((current) => current.filter((entry) => entry.id !== id))} />
              </Card>
            ))}
          </div>
          {selectedDate >= today ? (
            <ScheduleForm
              date={selectedDate}
              workouts={workouts}
              preferredLevelKey={preferredLevelKey}
              onSaved={upsert}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <Alert className="mt-5">{t("pastDate")}</Alert>
          )}
        </div>
      ) : null}
    </div>
  );
}
