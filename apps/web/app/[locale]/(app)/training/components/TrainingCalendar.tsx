"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { useConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import MobileDateField from "@/components/ui/MobileDateField";
import { Link } from "@/i18n/navigation";
import { formatCalendarDate, formatTime } from "@/lib/date-formatters";
import type { ClassSession } from "@/lib/boxes";
import {
  fromDateValue,
  monthRange,
  type ScheduledWorkout,
  type ScheduledWorkoutsResponse,
  type TrainingCalendarWorkout,
  toDateValue,
} from "@/lib/scheduled-workouts";

type PlanItem =
  | { kind: "workout"; date: string; sortValue: string; item: ScheduledWorkout }
  | { kind: "class"; date: string; sortValue: string; item: ClassSession };

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

function weekDaysFor(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
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
    return (
      (leftIndex < 0 ? levelOrder.length : leftIndex) -
      (rightIndex < 0 ? levelOrder.length : rightIndex)
    );
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

function classDate(item: ClassSession) {
  return item.startsAt.slice(0, 10);
}

function classWorkoutLabel(item: ClassSession, emptyLabel: string, levelName: (key: string, fallback: string) => string) {
  if (!item.workout) return emptyLabel;
  return `${item.workout.name}${item.workoutVariant ? ` · ${levelName(item.workoutVariant.level.key, item.workoutVariant.level.name)}` : ""}`;
}

function classWorkoutHref(item: ClassSession) {
  if (!item.workout) return null;
  const variation = item.workoutVariant ? `?variation=${encodeURIComponent(item.workoutVariant.level.key)}` : "";
  return `/workouts/${item.workout.id}${variation}` as const;
}

function ScheduleSummary({ item, compact = false }: { item: ScheduledWorkout; compact?: boolean }) {
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
      <h3 className={`${compact ? "mt-2 text-base" : "mt-3 text-lg"} break-words font-bold`}>
        {item.workout.name}
      </h3>
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

function ClassSummary({ item, compact = false }: { item: ClassSession; compact?: boolean }) {
  const t = useTranslations("training");
  const levelT = useTranslations("workoutLevels.names");
  const locale = useLocale();
  const spots = Math.max(0, item.capacity - item.bookedCount);
  const href = classWorkoutHref(item);
  const levelName = (key: string, fallback: string) => {
    const translationKey = key.toLowerCase();
    return levelT.has(translationKey) ? levelT(translationKey) : fallback;
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{t("classBooking")}</Badge>
        <Badge>{t("classSpots", { count: spots })}</Badge>
      </div>
      <h3 className={`${compact ? "mt-2 text-base" : "mt-3 text-lg"} break-words font-bold`}>{item.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {formatCalendarDate(classDate(item), locale)} · {formatTime(item.startsAt, locale)} · {t("classDuration", { duration: item.durationMinutes })}
      </p>
      {href ? (
        <Link
          href={href}
          className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t("assignedWorkout")}</span>
            <span className="block truncate">{classWorkoutLabel(item, t("classWorkoutOptional"), levelName)}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-accent">→</span>
        </Link>
      ) : (
        <p className="mt-2 text-sm font-semibold text-blue-300">
          {classWorkoutLabel(item, t("classWorkoutOptional"), levelName)}
        </p>
      )}
      {item.description ? (
        <p className="mt-3 break-words text-sm text-muted">{item.description}</p>
      ) : null}
    </div>
  );
}

type SessionActionsProps = {
  item: ScheduledWorkout;
  onUpdated: (item: ScheduledWorkout) => void;
  onRemoved: (id: string) => void;
};

function PlanItemCard({
  entry,
  onUpdated,
  onRemoved,
}: {
  entry: PlanItem;
  onUpdated: (item: ScheduledWorkout) => void;
  onRemoved: (id: string) => void;
}) {
  const t = useTranslations("training");
  const locale = useLocale();
  const timeLabel = entry.kind === "class" ? formatTime(entry.item.startsAt, locale) : t("anytime");

  return (
    <Card className={`p-4 ${entry.kind === "class" ? "border-blue-500/40" : ""}`}>
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated px-2 text-center text-sm font-black">
          {timeLabel}
        </div>
        <div className="min-w-0 flex-1">
          {entry.kind === "workout" ? (
            <>
              <ScheduleSummary item={entry.item} compact />
              <SessionActions
                item={entry.item}
                onUpdated={onUpdated}
                onRemoved={onRemoved}
              />
            </>
          ) : (
            <ClassSummary item={entry.item} compact />
          )}
        </div>
      </div>
    </Card>
  );
}

function AthleteCommentForm({
  item,
  onUpdated,
}: Pick<SessionActionsProps, "item" | "onUpdated">) {
  const t = useTranslations("training");
  const [comment, setComment] = useState(item.athleteComment ?? "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/scheduled-workouts/${item.id}/comment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment }),
        },
      );
      if (!response.ok) throw new Error();
      onUpdated((await response.json()) as ScheduledWorkout);
      setEditing(false);
    } catch {
      setError(t("commentError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-4">
        {item.athleteComment ? (
          <p className="rounded-lg border border-border bg-surface p-3 text-sm">
            <span className="font-semibold">{t("yourComment")}</span>{" "}
            {item.athleteComment}
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          className="mt-2"
        >
          {item.athleteComment ? t("editComment") : t("addComment")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mt-4 rounded-lg border border-border p-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <label
        htmlFor={`athlete-comment-${item.id}`}
        className="text-sm font-semibold"
      >
        {t("commentLabel")}
      </label>
      <textarea
        id={`athlete-comment-${item.id}`}
        maxLength={2000}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("commentPlaceholder")}
        className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background p-3"
      />
      <div className="mt-2 flex gap-2">
        <Button type="submit" size="sm" isLoading={submitting}>
          {t("saveComment")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setComment(item.athleteComment ?? "");
            setEditing(false);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function SessionActions({ item, onUpdated, onRemoved }: SessionActionsProps) {
  const t = useTranslations("training");
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(item.scheduledDate.slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { confirm, dialog } = useConfirmationDialog();

  if (item.status === "COMPLETED") {
    return (
      <div className="mt-4 border-t border-border pt-4">
        <ButtonLink href={workoutHref(item)} variant="secondary" size="sm">
          {t("viewResult")}
        </ButtonLink>
        <AthleteCommentForm item={item} onUpdated={onUpdated} />
      </div>
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
        setError(
          response.status === 409 ? t("duplicateError") : t("saveError"),
        );
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
    if (!(await confirm({ description: t("removeConfirm") }))) return;
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
      {dialog}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {editing ? (
        <form
          onSubmit={reschedule}
          className="mt-3 flex flex-col gap-3 sm:flex-row"
        >
          <MobileDateField
            id={`session-date-${item.id}`}
            label={t("date")}
            required
            min={toDateValue(new Date())}
            value={date}
            onChange={setDate}
            planningShortcuts
            className="w-full sm:max-w-sm"
          />
          <Button type="submit" size="sm" isLoading={submitting}>
            {t("save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            {t("cancel")}
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={workoutHref(item)} size="sm">
            {t("openWorkout")}
          </ButtonLink>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            {t("reschedule")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isLoading={submitting}
            onClick={remove}
          >
            {t("remove")}
          </Button>
        </div>
      )}
      <AthleteCommentForm item={item} onUpdated={onUpdated} />
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
      selected
        ? (orderedVariants(selected, preferredLevelKey)[0]?.id ?? "")
        : "",
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
        setError(
          response.status === 409 ? t("duplicateError") : t("saveError"),
        );
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
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="h-11 w-11 rounded-lg text-xl text-muted hover:bg-surface-elevated"
        >
          ×
        </button>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="calendar-workout"
            className="mb-1.5 block text-sm font-medium"
          >
            {t("workout")}
          </label>
          <select
            id="calendar-workout"
            value={workoutId}
            onChange={(event) => selectWorkout(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-accent"
          >
            <option value="">{t("selectWorkout")}</option>
            {workouts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        {workout && workout.variants.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-medium">{t("variation")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {orderedVariants(workout, preferredLevelKey).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={variantId === variant.id}
                  onClick={() => setVariantId(variant.id)}
                  className={[
                    "min-h-11 rounded-full border px-4 text-sm font-semibold",
                    variantId === variant.id
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted",
                  ].join(" ")}
                >
                  {variant.level.name}
                  {variant.name ? ` · ${variant.name}` : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div>
          <label
            htmlFor="calendar-notes"
            className="mb-1.5 block text-sm font-medium"
          >
            {t("notesOptional")}
          </label>
          <textarea
            id="calendar-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
          />
        </div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            className="w-full sm:w-auto"
          >
            {t("addToPlan")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function TrainingCalendar() {
  const t = useTranslations("training");
  const locale = useLocale();
  const { activeBox } = useActiveBox();
  const today = toDateValue(new Date());
  const selectedDayRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [classBookings, setClassBookings] = useState<ClassSession[]>([]);
  const [workouts, setWorkouts] = useState<TrainingCalendarWorkout[]>([]);
  const [preferredLevelKey, setPreferredLevelKey] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { from, to } = monthRange(month);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const query = new URLSearchParams({ from, to });
        const classFrom = new Date(`${from}T00:00:00`);
        const classTo = new Date(`${to}T23:59:59`);
        const classRequest = activeBox
          ? fetch(`/api/boxes/${activeBox.id}/classes?from=${classFrom.toISOString()}&to=${classTo.toISOString()}`, { signal: controller.signal })
          : Promise.resolve(null);
        const [scheduleResponse, workoutsResponse, profileResponse, classesResponse] = await Promise.all([
          fetch(`/api/scheduled-workouts?${query}`, {
            signal: controller.signal,
          }),
          fetch("/api/workouts", { signal: controller.signal }),
          fetch("/api/athlete-profile", { signal: controller.signal }),
          classRequest,
        ]);
        if (!scheduleResponse.ok || !workoutsResponse.ok || !profileResponse.ok || (classesResponse && !classesResponse.ok))
          throw new Error("load");
        const scheduleData =
          (await scheduleResponse.json()) as ScheduledWorkoutsResponse;
        setSchedule(scheduleData.items);
        if (classesResponse) {
          const classData = (await classesResponse.json()) as { classes?: ClassSession[] };
          setClassBookings((classData.classes ?? []).filter((item) => Boolean(item.currentUserBooking)));
        } else {
          setClassBookings([]);
        }
        setWorkouts(
          (await workoutsResponse.json()) as TrainingCalendarWorkout[],
        );
        const profile = (await profileResponse.json()) as {
          preferredWorkoutLevel?: { key: string } | null;
        };
        setPreferredLevelKey(profile.preferredWorkoutLevel?.key ?? null);
      } catch (loadError) {
        if (!(loadError instanceof Error && loadError.name === "AbortError"))
          setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [activeBox, from, to]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, PlanItem[]>();
    for (const item of schedule) {
      const key = item.scheduledDate.slice(0, 10);
      grouped.set(key, [...(grouped.get(key) ?? []), { kind: "workout", date: key, sortValue: item.scheduledDate, item }]);
    }
    for (const item of classBookings) {
      const key = classDate(item);
      grouped.set(key, [...(grouped.get(key) ?? []), { kind: "class", date: key, sortValue: item.startsAt, item }]);
    }
    for (const [key, items] of grouped) {
      grouped.set(key, items.toSorted((left, right) => left.sortValue.localeCompare(right.sortValue)));
    }
    return grouped;
  }, [classBookings, schedule]);
  const selectedDateValue = selectedDate ?? today;
  const selectedDateObject = fromDateValue(selectedDateValue);
  const weekDays = weekDaysFor(selectedDateObject);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(selectedDateObject);
  const selectedItems = itemsByDate.get(selectedDateValue) ?? [];

  function upsert(item: ScheduledWorkout) {
    setSchedule((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [...current, item];
    });
  }

  function selectDate(value: string) {
    setSelectedDate(value);
    const nextDate = fromDateValue(value);
    setMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setShowScheduleForm(false);
    window.setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function goToToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    selectDate(today);
  }

  function moveWeek(amount: number) {
    selectDate(toDateValue(addDays(selectedDateObject, amount * 7)));
  }

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => moveWeek(-1)}
            aria-label={t("previousWeek")}
          >
            ←
          </Button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold capitalize">
              {monthLabel}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => moveWeek(1)}
            aria-label={t("nextWeek")}
          >
            →
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={goToToday}
          className="mt-3 w-full sm:w-auto"
        >
          {t("today")} · {formatCalendarDate(today, locale)}
        </Button>
      </div>

      {error ? (
        <Alert variant="error" className="mt-5">
          {t("loadError")}
        </Alert>
      ) : null}
      {loading ? (
        <div className="mt-5 grid gap-3" aria-label={t("loading")}>
          {[0, 1, 2].map((item) => (
            <Card key={item} className="h-28 animate-pulse bg-surface-elevated">
              <span className="sr-only">{t("loading")}</span>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="-mx-4 mt-5 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {weekDays.map((date) => {
              const value = toDateValue(date);
              const items = itemsByDate.get(value) ?? [];
              const classCount = items.filter((item) => item.kind === "class").length;
              const workoutCount = items.filter((item) => item.kind === "workout").length;
              const active = value === selectedDateValue;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectDate(value)}
                  aria-pressed={active}
                  aria-label={t("selectDate", {
                    date: formatCalendarDate(value, locale),
                    count: items.length,
                  })}
                  className={[
                    "min-w-[4.5rem] snap-center rounded-2xl border px-2 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "border-accent bg-accent text-accent-foreground shadow-sm"
                      : "border-border bg-surface text-foreground",
                    value === today && !active ? "ring-1 ring-accent/60" : "",
                  ].join(" ")}
                >
                  <span className={`block text-[11px] font-bold uppercase tracking-wide ${active ? "text-accent-foreground/70" : "text-muted"}`}>
                    {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)}
                  </span>
                  <span className="mt-0.5 block text-xl font-black leading-none">{date.getDate()}</span>
                  <span className="mt-2 flex min-h-1.5 justify-center gap-1">
                    {classCount ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-foreground" : "bg-blue-400"}`} /> : null}
                    {workoutCount ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-foreground" : "bg-accent"}`} /> : null}
                    {!items.length ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-foreground/40" : "bg-muted/40"}`} /> : null}
                  </span>
                  <span className={`mt-1 block text-[10px] font-semibold ${active ? "text-accent-foreground/70" : items.length ? "text-accent" : "text-muted"}`}>
                    {items.length ? t("itemCount", { count: items.length }) : "·"}
                  </span>
                </button>
              );
            })}
        </div>
      ) : null}

      {selectedDate ? (
        <div ref={selectedDayRef} className="mt-6 scroll-mt-24" id="selected-training-day">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("selectedDay")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {formatCalendarDate(selectedDate, locale)}
              </h2>
            </div>
          </div>
          {selectedItems.length ? (
            <div className="mt-4 grid gap-3">
              {selectedItems.map((entry) => (
                <PlanItemCard
                  key={`${entry.kind}-${entry.item.id}`}
                  entry={entry}
                  onUpdated={upsert}
                  onRemoved={(id) =>
                    setSchedule((current) =>
                      current.filter((entry) => entry.id !== id),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="mt-4 border-dashed p-6 text-center">
              <h3 className="font-bold">{t("emptyDayTitle")}</h3>
              <p className="mt-1 text-sm text-muted">{t("emptyDayDescription")}</p>
            </Card>
          )}
          {selectedDate >= today && !showScheduleForm ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setShowScheduleForm(true)}
            >
              {t("addWorkoutToDay")}
            </Button>
          ) : null}
          {selectedDate >= today && showScheduleForm ? (
            <ScheduleForm
              date={selectedDate}
              workouts={workouts}
              preferredLevelKey={preferredLevelKey}
              onSaved={(item) => {
                upsert(item);
                setShowScheduleForm(false);
              }}
              onClose={() => setShowScheduleForm(false)}
            />
          ) : null}
          {selectedDate < today ? (
            <Alert className="mt-5">{t("pastDate")}</Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
