"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import WorkoutCard, { Workout } from "./WorkoutCard";

type Filter = "ALL" | "BENCHMARK";
type LibraryView = "ACTIVE" | "ARCHIVED";

type Props = {
  workouts: Workout[];
  archivedWorkouts: Workout[];
  currentUserId: string | null;
};

export default function WorkoutLibrary({
  workouts,
  archivedWorkouts,
  currentUserId,
}: Props) {
  const t = useTranslations("workouts.library");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [view, setView] = useState<LibraryView>("ACTIVE");

  const visibleWorkouts = view === "ACTIVE" ? workouts : archivedWorkouts;

  const filteredWorkouts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return visibleWorkouts.filter((workout) => {
      if (filter === "BENCHMARK" && !workout.isBenchmark) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const movementNames = workout.variants.flatMap((variant) =>
        variant.sections.flatMap((section) =>
          section.movements.map((item) => item.movement.name),
        ),
      );

      return [
        workout.name,
        workout.description ?? "",
        workout.type.name,
        ...movementNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [visibleWorkouts, search, filter]);

  return (
    <>
      <div
        className="mt-8 flex gap-2 border-b border-border"
        role="tablist"
        aria-label={t("viewLabel")}
      >
        <ViewTab
          active={view === "ACTIVE"}
          onClick={() => setView("ACTIVE")}
        >
          {t("active")}
        </ViewTab>

        <ViewTab
          active={view === "ARCHIVED"}
          onClick={() => setView("ARCHIVED")}
        >
          {t("archived")}
        </ViewTab>
      </div>

      <div className="mt-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          {t("all")}
        </FilterButton>

        <FilterButton
          active={filter === "BENCHMARK"}
          onClick={() => setFilter("BENCHMARK")}
        >
          {t("benchmark")}
        </FilterButton>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted">
          {t("workoutCount", { count: filteredWorkouts.length })}
        </p>
      </div>

      {filteredWorkouts.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-semibold">
            {view === "ARCHIVED" ? t("archivedEmptyTitle") : t("emptyTitle")}
          </p>

          <p className="mt-2 text-sm text-muted">
            {view === "ARCHIVED"
              ? t("archivedEmptyDescription")
              : t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              canManage={workout.createdByUser.id === currentUserId}
            />
          ))}
        </div>
      )}
    </>
  );
}

type ToggleButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function ViewTab({ children, active, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "border-b-2 px-3 py-3 text-sm font-semibold transition",
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilterButton({ children, active, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
