"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Badge from "@/components/ui/Badge";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import {
  formatMeasurementResult,
  formatTime,
  formatWorkoutResult as formatWorkoutResultValue,
} from "@/lib/result-formatters";
import type { MeasurementResultValues, WeightUnit } from "@/lib/result-types";

type WorkoutHistoryMovement = {
  id: string;
  movement: {
    id: string;
    name: string;
  };
  measurementType: {
    key: string;
    name: string;
  };
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;
  distance: number | null;
  durationSeconds: number | null;
  calories: number | null;
  notes: string | null;
};

type GroupedWorkoutMovement = {
  movement: {
    id: string;
    name: string;
  };
  results: WorkoutHistoryMovement[];
};

export type WorkoutTrainingHistoryItem = {
  id: string;
  type: "WORKOUT";
  performedAt: string;

  workout: {
    id: string;
    name: string;
    isBenchmark: boolean;
    type: {
      key: string;
      name: string;
    };
  };

  variant: {
    id: string;
    name: string | null;
  };

  level: {
    key: string;
    name: string;
  };

  prescriptionCategory: {
    key: string;
    name: string;
  } | null;

  result: {
    type: {
      key: string;
      name: string;
    };
    timeSeconds: number | null;
    rounds: number | null;
    reps: number | null;
    load: number | null;
    weightUnit: WeightUnit | null;
  };

  movements: WorkoutHistoryMovement[];
  notes: string | null;
};

export type MovementTrainingHistoryItem = {
  id: string;
  type: "MOVEMENT";
  performedAt: string;

  movement: {
    id: string;
    name: string;
  };

  measurementType: {
    key: string;
    name: string;
  };

  result: {
    reps: number | null;
    load: number | null;
    weightUnit: WeightUnit | null;
    distance: number | null;
    durationSeconds: number | null;
    calories: number | null;
  };

  notes: string | null;
};

export type TrainingHistoryItem =
  WorkoutTrainingHistoryItem | MovementTrainingHistoryItem;

type Props = {
  results: TrainingHistoryItem[];
};

type EntryFilter = "ALL" | "WORKOUT" | "MOVEMENT";

type HistoryGroup = {
  key: string;
  date: Date;
  items: TrainingHistoryItem[];
};

function getDateKey(value: string) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function groupWorkoutMovements(
  movements: WorkoutHistoryMovement[],
): GroupedWorkoutMovement[] {
  const groups = new Map<string, GroupedWorkoutMovement>();

  for (const result of movements) {
    const existing = groups.get(result.movement.id);

    if (existing) {
      existing.results.push(result);
      continue;
    }

    groups.set(result.movement.id, {
      movement: result.movement,
      results: [result],
    });
  }

  return Array.from(groups.values());
}

export default function HistoryList({ results }: Props) {
  const t = useTranslations("history");
  const typeT = useTranslations("workoutTypes");
  const resultTypeT = useTranslations("resultTypes");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("ALL");
  const [workoutType, setWorkoutType] = useState("ALL");
  const [resultType, setResultType] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Set<string>>(
    new Set(),
  );

  const getWorkoutTypeName = useCallback(
    (key: string, fallback: string) => {
      const translationKey = key.toLowerCase();

      return typeT.has(translationKey) ? typeT(translationKey) : fallback;
    },
    [typeT],
  );

  const getResultTypeName = useCallback(
    (key: string, fallback: string) => {
      const translationKey = key.toLowerCase();

      return resultTypeT.has(translationKey)
        ? resultTypeT(translationKey)
        : fallback;
    },
    [resultTypeT],
  );

  function formatWorkoutResult(result: WorkoutTrainingHistoryItem) {
    return formatWorkoutResultValue(
      {
        resultType: result.result.type,
        timeSeconds: result.result.timeSeconds,
        rounds: result.result.rounds,
        reps: result.result.reps,
        load: result.result.load,
        weightUnit: result.result.weightUnit,
      },
      {
        formatReps: (count) => t("repsValue", { count }),
      },
    );
  }

  function formatMeasurement(
    measurementTypeKey: string,
    result: MeasurementResultValues,
  ) {
    return formatMeasurementResult(measurementTypeKey, result, {
      formatReps: (count) => t("repsValue", { count }),
    });
  }

  function formatGroupDate(date: Date) {
    const today = startOfDay(new Date());
    const groupDate = startOfDay(date);

    const differenceInDays = Math.round(
      (today.getTime() - groupDate.getTime()) / 86_400_000,
    );

    if (differenceInDays === 0) {
      return t("dates.today");
    }

    if (differenceInDays === 1) {
      return t("dates.yesterday");
    }

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }).format(date);
  }

  function toggleWorkout(workoutResultId: string) {
    setExpandedWorkoutIds((current) => {
      const next = new Set(current);

      if (next.has(workoutResultId)) {
        next.delete(workoutResultId);
      } else {
        next.add(workoutResultId);
      }

      return next;
    });
  }

  const workoutResults = useMemo(
    () =>
      results.filter(
        (result): result is WorkoutTrainingHistoryItem =>
          result.type === "WORKOUT",
      ),
    [results],
  );

  const workoutTypes = useMemo(() => {
    const types = new Map<string, string>();

    workoutResults.forEach((result) => {
      types.set(result.workout.type.key, result.workout.type.name);
    });

    return Array.from(types.entries()).sort((a, b) =>
      getWorkoutTypeName(a[0], a[1]).localeCompare(
        getWorkoutTypeName(b[0], b[1]),
        locale,
      ),
    );
  }, [workoutResults, locale, getWorkoutTypeName]);

  const resultTypes = useMemo(() => {
    const types = new Map<string, string>();

    workoutResults.forEach((result) => {
      types.set(result.result.type.key, result.result.type.name);
    });

    return Array.from(types.entries()).sort((a, b) =>
      getResultTypeName(a[0], a[1]).localeCompare(
        getResultTypeName(b[0], b[1]),
        locale,
      ),
    );
  }, [workoutResults, locale, getResultTypeName]);

  const workoutLevels = useMemo(() => {
    const levels = new Map<string, string>();

    workoutResults.forEach((result) => {
      levels.set(result.level.key, result.level.name);
    });

    return Array.from(levels.entries()).sort((a, b) => {
      if (a[0] === "RX") {
        return -1;
      }

      if (b[0] === "RX") {
        return 1;
      }

      return a[1].localeCompare(b[1], locale);
    });
  }, [workoutResults, locale]);

  const filteredResults = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return results.filter((result) => {
      if (entryFilter !== "ALL" && result.type !== entryFilter) {
        return false;
      }

      const entryName =
        result.type === "WORKOUT" ? result.workout.name : result.movement.name;

      if (
        normalizedSearch &&
        !entryName.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (result.type === "MOVEMENT") {
        return (
          workoutType === "ALL" && resultType === "ALL" && levelFilter === "ALL"
        );
      }

      if (workoutType !== "ALL" && result.workout.type.key !== workoutType) {
        return false;
      }

      if (resultType !== "ALL" && result.result.type.key !== resultType) {
        return false;
      }

      if (levelFilter !== "ALL" && result.level.key !== levelFilter) {
        return false;
      }

      return true;
    });
  }, [results, search, entryFilter, workoutType, resultType, levelFilter]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, HistoryGroup>();

    filteredResults.forEach((result) => {
      const key = getDateKey(result.performedAt);
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(result);
        return;
      }

      groups.set(key, {
        key,
        date: new Date(result.performedAt),
        items: [result],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) =>
            new Date(b.performedAt).getTime() -
            new Date(a.performedAt).getTime(),
        ),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredResults]);

  const hasActiveFilters =
    search.trim() !== "" ||
    entryFilter !== "ALL" ||
    workoutType !== "ALL" ||
    resultType !== "ALL" ||
    levelFilter !== "ALL";

  function clearFilters() {
    setSearch("");
    setEntryFilter("ALL");
    setWorkoutType("ALL");
    setResultType("ALL");
    setLevelFilter("ALL");
  }

  if (results.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          +
        </div>

        <p className="mt-4 font-semibold">{t("empty.title")}</p>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          {t("empty.description")}
        </p>

        <ButtonLink href="/workouts" className="mt-5 px-5">
          {t("empty.browseWorkouts")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <section className="mt-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="historySearch"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("filters.search")}
            </label>

            <input
              id="historySearch"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="entryType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("activity.label")}
            </label>

            <select
              id="entryType"
              value={entryFilter}
              onChange={(event) =>
                setEntryFilter(event.target.value as EntryFilter)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">{t("activity.all")}</option>
              <option value="WORKOUT">{t("activity.workouts")}</option>
              <option value="MOVEMENT">{t("activity.movements")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="workoutType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("filters.workoutType")}
            </label>

            <select
              id="workoutType"
              value={workoutType}
              onChange={(event) => setWorkoutType(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">{t("filters.allWorkoutTypes")}</option>

              {workoutTypes.map(([key, name]) => (
                <option key={key} value={key}>
                  {getWorkoutTypeName(key, name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="resultType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("filters.resultType")}
            </label>

            <select
              id="resultType"
              value={resultType}
              onChange={(event) => setResultType(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">{t("filters.allResultTypes")}</option>

              {resultTypes.map(([key, name]) => (
                <option key={key} value={key}>
                  {getResultTypeName(key, name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="levelFilter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("filters.workoutLevel")}
            </label>

            <select
              id="levelFilter"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">{t("filters.allWorkoutLevels")}</option>

              {workoutLevels.map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            {t("filters.showing", {
              filtered: filteredResults.length,
              total: results.length,
            })}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-accent transition hover:text-accent-strong"
            >
              {t("filters.clear")}
            </button>
          )}
        </div>
      </section>

      {filteredResults.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-semibold">{t("noMatches.title")}</p>

          <p className="mt-2 text-sm text-muted">
            {t("noMatches.description")}
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40"
          >
            {t("filters.clear")}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {groupedResults.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="shrink-0 text-sm font-black uppercase tracking-[0.14em] text-foreground">
                  {formatGroupDate(group.date)}
                </h2>

                <div className="h-px flex-1 bg-border" />

                <span className="shrink-0 text-xs font-medium text-muted">
                  {group.items.length}
                </span>
              </div>

              <div className="relative space-y-4 sm:pl-6">
                <div className="absolute bottom-4 left-[5px] top-4 hidden w-px bg-border sm:block" />

                {group.items.map((result) => {
                  if (result.type === "MOVEMENT") {
                    return (
                      <div key={`movement-${result.id}`} className="relative">
                        <div className="absolute left-[-21px] top-7 z-10 hidden h-2.5 w-2.5 rounded-full border-2 border-accent bg-background sm:block" />

                        <Card className="overflow-hidden">
                          <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge>{result.measurementType.name}</Badge>

                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                    {t("labels.movement")}
                                  </span>
                                </div>

                                <Link
                                  href={`/movements/${result.movement.id}`}
                                  className="mt-3 block truncate text-xl font-bold transition hover:text-accent"
                                >
                                  {result.movement.name}
                                </Link>

                                <p className="mt-2 text-sm text-muted">
                                  {formatTime(result.performedAt, locale)}
                                </p>
                              </div>

                              <div className="sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                  {t("labels.standaloneResult")}
                                </p>

                                <p className="mt-1 text-2xl font-black tracking-tight">
                                  {formatMeasurement(
                                    result.measurementType.key,
                                    result.result,
                                  )}
                                </p>
                              </div>
                            </div>

                            {result.notes && (
                              <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
                                {result.notes}
                              </p>
                            )}
                          </div>
                        </Card>
                      </div>
                    );
                  }

                  const groupedMovements = groupWorkoutMovements(
                    result.movements,
                  );

                  const isExpanded = expandedWorkoutIds.has(result.id);

                  const visibleMovements = isExpanded
                    ? groupedMovements
                    : groupedMovements.slice(0, 2);

                  const hiddenMovementCount = Math.max(
                    groupedMovements.length - 2,
                    0,
                  );

                  return (
                    <div key={`workout-${result.id}`} className="relative">
                      <div className="absolute left-[-21px] top-7 z-10 hidden h-2.5 w-2.5 rounded-full border-2 border-accent bg-background sm:block" />

                      <Card className="overflow-hidden">
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge>{result.level.name}</Badge>

                                {result.prescriptionCategory && (
                                  <Badge>
                                    {result.prescriptionCategory.name}
                                  </Badge>
                                )}

                                {result.workout.isBenchmark && (
                                  <Badge>{t("labels.benchmark")}</Badge>
                                )}

                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                  {t("labels.workout")}
                                </span>
                              </div>

                              <Link
                                href={`/workouts/${result.workout.id}`}
                                className="mt-3 block truncate text-xl font-bold transition hover:text-accent"
                              >
                                {result.workout.name}
                              </Link>

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                <span>
                                  {getWorkoutTypeName(
                                    result.workout.type.key,
                                    result.workout.type.name,
                                  )}
                                </span>

                                <span>•</span>

                                <span>
                                  {formatTime(result.performedAt, locale)}
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                {getResultTypeName(
                                  result.result.type.key,
                                  result.result.type.name,
                                )}
                              </p>

                              <p className="mt-1 text-3xl font-black tracking-tight">
                                {formatWorkoutResult(result)}
                              </p>
                            </div>
                          </div>

                          {groupedMovements.length > 0 && (
                            <div className="mt-5 border-t border-border pt-5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                  {t("labels.movementResults")}
                                </p>

                                <span className="text-xs text-muted">
                                  {groupedMovements.length}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2">
                                {visibleMovements.map((movementGroup) => (
                                  <div
                                    key={movementGroup.movement.id}
                                    className="rounded-lg border border-border bg-background px-4 py-3"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <Link
                                        href={`/movements/${movementGroup.movement.id}`}
                                        className="min-w-0 truncate font-semibold transition hover:text-accent"
                                      >
                                        {movementGroup.movement.name}
                                      </Link>

                                      <div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                                        {movementGroup.results.map(
                                          (movementResult) => (
                                            <div
                                              key={movementResult.id}
                                              className="flex items-baseline gap-1.5"
                                            >
                                              <span className="text-xs text-muted">
                                                {
                                                  movementResult.measurementType
                                                    .name
                                                }
                                              </span>

                                              <span className="font-bold">
                                                {formatMeasurement(
                                                  movementResult.measurementType
                                                    .key,
                                                  movementResult,
                                                )}
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>

                                    {movementGroup.results.some(
                                      (movementResult) =>
                                        Boolean(movementResult.notes),
                                    ) && (
                                      <div className="mt-2 border-t border-border pt-2">
                                        {movementGroup.results
                                          .filter(
                                            (movementResult) =>
                                              movementResult.notes,
                                          )
                                          .map((movementResult) => (
                                            <p
                                              key={`${movementResult.id}-note`}
                                              className="text-xs text-muted"
                                            >
                                              {movementResult.notes}
                                            </p>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {hiddenMovementCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleWorkout(result.id)}
                                  aria-expanded={isExpanded}
                                  className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-accent/5"
                                >
                                  {isExpanded
                                    ? t("labels.showLess")
                                    : t("labels.showMore", {
                                        count: hiddenMovementCount,
                                      })}
                                </button>
                              )}
                            </div>
                          )}

                          {result.notes && (
                            <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
                              {result.notes}
                            </p>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
