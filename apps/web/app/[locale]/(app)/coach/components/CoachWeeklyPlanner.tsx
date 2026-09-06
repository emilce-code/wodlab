"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TrainingCalendarWorkout } from "@/lib/scheduled-workouts";

type PrescriptionCategory = { key: string; name: string };

type WeeklyAssignment = {
  id: string;
  scheduledDate: string;
  status: "PLANNED" | "COMPLETED";
  coachNotes: string | null;
  createdByCurrentCoach: boolean;
  canManage: boolean;
  workout: { id: string; name: string };
  workoutVariant: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  };
  prescriptionCategory: PrescriptionCategory | null;
  assignedByCoachProfile: { id: string; displayName: string } | null;
};

type WeeklyPlan = {
  weekStart: string;
  assignments: WeeklyAssignment[];
};

type AssignmentOptions = {
  workouts: TrainingCalendarWorkout[];
  prescriptionCategories: PrescriptionCategory[];
};

type Props = {
  athleteId: string;
  onChanged?: () => void | Promise<void>;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date = new Date()) {
  const result = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export default function CoachWeeklyPlanner({ athleteId, onChanged }: Props) {
  const t = useTranslations("coach.weeklyPlan");
  const locale = useLocale();
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek()));
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [options, setOptions] = useState<AssignmentOptions | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [workoutId, setWorkoutId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [prescriptionCategoryKey, setPrescriptionCategoryKey] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadWeek = useCallback(
    async (targetWeek: string) => {
      const response = await fetch(
        `/api/coach/athletes/${athleteId}/weekly-plan?weekStart=${targetWeek}`,
      );
      if (!response.ok) throw new Error();
      const data = (await response.json()) as WeeklyPlan;
      setPlan(data);
      return data;
    },
    [athleteId],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/coach/assignment-options"),
      fetch(
        `/api/coach/athletes/${athleteId}/weekly-plan?weekStart=${weekStart}`,
      ),
    ])
      .then(async ([optionsResponse, planResponse]) => {
        if (!optionsResponse.ok || !planResponse.ok) throw new Error();
        const [optionsData, planData] = await Promise.all([
          optionsResponse.json() as Promise<AssignmentOptions>,
          planResponse.json() as Promise<WeeklyPlan>,
        ]);
        if (active) {
          setOptions(optionsData);
          setPlan(planData);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      });
    return () => {
      active = false;
    };
  }, [athleteId, t, weekStart]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const key = shiftDate(weekStart, index);
        const date = new Date(`${key}T00:00:00.000Z`);
        return {
          key,
          label: new Intl.DateTimeFormat(locale, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(date),
        };
      }),
    [locale, weekStart],
  );

  const selectedWorkout = options?.workouts.find(
    (workout) => workout.id === workoutId,
  );

  function changeWeek(offset: number) {
    const nextWeek = shiftDate(weekStart, offset * 7);
    setWeekStart(nextWeek);
    setSelectedDate(nextWeek);
    setError(null);
    setSuccess(null);
  }

  function chooseWorkout(id: string) {
    const workout = options?.workouts.find((item) => item.id === id);
    setWorkoutId(id);
    setVariantId(workout?.variants[0]?.id ?? "");
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/coach/athletes/${athleteId}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workoutId,
            workoutVariantId: variantId,
            scheduledDate: selectedDate,
            ...(prescriptionCategoryKey ? { prescriptionCategoryKey } : {}),
            ...(notes.trim() ? { coachNotes: notes.trim() } : {}),
          }),
        },
      );
      if (!response.ok) {
        setError(response.status === 409 ? t("duplicateError") : t("saveError"));
        return;
      }
      setWorkoutId("");
      setVariantId("");
      setPrescriptionCategoryKey("");
      setNotes("");
      setSuccess(t("saved"));
      await loadWeek(weekStart);
      await onChanged?.();
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAssignment(assignment: WeeklyAssignment) {
    if (!window.confirm(t("removeConfirm", { workout: assignment.workout.name }))) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/coach/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(t("removeError"));
        return;
      }
      await loadWeek(weekStart);
      await onChanged?.();
    } catch {
      setError(t("connectionError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPreviousWeek() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sourceWeek = shiftDate(weekStart, -7);
      const response = await fetch(
        `/api/coach/athletes/${athleteId}/weekly-plan?weekStart=${sourceWeek}`,
      );
      if (!response.ok) throw new Error();
      const previous = (await response.json()) as WeeklyPlan;
      const assignments = previous.assignments.filter(
        (assignment) => assignment.createdByCurrentCoach,
      );
      if (assignments.length === 0) {
        setError(t("nothingToCopy"));
        return;
      }
      let copied = 0;
      for (const assignment of assignments) {
        const saveResponse = await fetch(
          `/api/coach/athletes/${athleteId}/assignments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workoutId: assignment.workout.id,
              workoutVariantId: assignment.workoutVariant.id,
              scheduledDate: shiftDate(assignment.scheduledDate.slice(0, 10), 7),
              ...(assignment.prescriptionCategory
                ? { prescriptionCategoryKey: assignment.prescriptionCategory.key }
                : {}),
              ...(assignment.coachNotes
                ? { coachNotes: assignment.coachNotes }
                : {}),
            }),
          },
        );
        if (saveResponse.ok) copied += 1;
        else if (saveResponse.status !== 409) throw new Error();
      }
      setSuccess(t("copied", { count: copied }));
      await loadWeek(weekStart);
      await onChanged?.();
    } catch {
      setError(t("copyError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => changeWeek(-1)}>
            {t("previous")}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => changeWeek(1)}>
            {t("next")}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={submitting} onClick={() => void copyPreviousWeek()}>
            {t("copyPrevious")}
          </Button>
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const assignments = plan?.assignments.filter(
            (assignment) => assignment.scheduledDate.slice(0, 10) === day.key,
          ) ?? [];
          return (
            <Card key={day.key} className="min-w-0 p-4">
              <button type="button" onClick={() => setSelectedDate(day.key)} className="w-full text-left">
                <span className={selectedDate === day.key ? "font-bold text-accent" : "font-bold"}>{day.label}</span>
              </button>
              <div className="mt-3 space-y-3">
                {assignments.length === 0 ? (
                  <p className="text-xs text-muted">{t("restDay")}</p>
                ) : assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-semibold">{assignment.workout.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge>{assignment.workoutVariant.level.name}</Badge>
                      <Badge variant={assignment.status === "COMPLETED" ? "accent" : "default"}>
                        {assignment.status === "COMPLETED" ? t("completed") : t("planned")}
                      </Badge>
                    </div>
                    {assignment.coachNotes ? <p className="mt-2 text-xs text-muted">{assignment.coachNotes}</p> : null}
                    {assignment.canManage ? (
                      <Button type="button" size="sm" variant="ghost" disabled={submitting} onClick={() => void removeAssignment(assignment)} className="mt-2 text-red-500">
                        {t("remove")}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="font-bold">{t("addTitle", { date: selectedDate })}</h3>
        <form onSubmit={assign} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium">
            {t("workout")}
            <select required value={workoutId} onChange={(event) => chooseWorkout(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base">
              <option value="">{t("selectWorkout")}</option>
              {options?.workouts.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t("variation")}
            <select required value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base">
              <option value="">{t("selectVariation")}</option>
              {selectedWorkout?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.level.name}{variant.name ? ` · ${variant.name}` : ""}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t("prescription")}
            <select value={prescriptionCategoryKey} onChange={(event) => setPrescriptionCategoryKey(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base">
              <option value="">{t("noPrescription")}</option>
              {options?.prescriptionCategories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium lg:col-span-2">
            {t("notes")}
            <input value={notes} maxLength={1000} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3" />
          </label>
          <Button type="submit" isLoading={submitting} className="sm:w-fit">
            {t("add")}
          </Button>
        </form>
      </Card>
    </section>
  );
}
