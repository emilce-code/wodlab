"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import type { PaginatedResponse } from "@/lib/pagination";

import WorkoutCard, { Workout } from "./WorkoutCard";

type Filter = "ALL" | "BENCHMARK";
type LibraryView = "ACTIVE" | "ARCHIVED";

type Props = {
  workouts: PaginatedResponse<Workout>;
  archivedWorkouts: PaginatedResponse<Workout>;
  preferredWorkoutLevelKey: string | null;
};

export default function WorkoutLibrary({
  workouts,
  archivedWorkouts,
  preferredWorkoutLevelKey,
}: Props) {
  const t = useTranslations("workouts.library");
  const paginationT = useTranslations("pagination");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [view, setView] = useState<LibraryView>("ACTIVE");
  const [pages, setPages] = useState<
    Record<string, PaginatedResponse<Workout>>
  >(() => ({
    "ACTIVE-ALL-": workouts,
    "ARCHIVED-ALL-": archivedWorkouts,
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedSearch = search.trim();
  const queryKey = `${view}-${filter}-${normalizedSearch.toLowerCase()}`;
  const displayedPage = pages[queryKey];
  const displayedWorkouts = displayedPage?.items ?? [];

  useEffect(() => {
    if (pages[queryKey]) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        setIsLoading(true);
        setError(null);
        try {
          const query = createQuery(view, filter, normalizedSearch, 1, 12);
          const response = await fetch(`/api/workouts?${query.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Unable to load workouts");
          const page = (await response.json()) as PaginatedResponse<Workout>;
          setPages((current) => ({ ...current, [queryKey]: page }));
        } catch (caughtError) {
          if (
            caughtError instanceof DOMException &&
            caughtError.name === "AbortError"
          )
            return;
          setError(t("loadError"));
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      },
      normalizedSearch ? 300 : 0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filter, normalizedSearch, pages, queryKey, t, view]);

  async function loadMore() {
    if (!displayedPage?.hasNextPage || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = createQuery(
        view,
        filter,
        normalizedSearch,
        displayedPage.page + 1,
        displayedPage.pageSize,
      );
      const response = await fetch(`/api/workouts?${query.toString()}`);
      if (!response.ok) throw new Error("Unable to load workouts");
      const nextPage = (await response.json()) as PaginatedResponse<Workout>;
      setPages((current) => ({
        ...current,
        [queryKey]: {
          ...nextPage,
          items: [...displayedPage.items, ...nextPage.items],
        },
      }));
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div
        className="mt-8 flex gap-2 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label={t("viewLabel")}
      >
        <ViewTab active={view === "ACTIVE"} onClick={() => setView("ACTIVE")}>
          {t("active")}
        </ViewTab>
        <ViewTab
          active={view === "ARCHIVED"}
          onClick={() => setView("ARCHIVED")}
        >
          {t("archived")}
        </ViewTab>
      </div>

      <div className="mt-6 relative">
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

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        >
          {t("all")}
        </FilterButton>
        <FilterButton
          active={filter === "BENCHMARK"}
          onClick={() => setFilter("BENCHMARK")}
        >
          {t("benchmark")}
        </FilterButton>
      </div>

      <div className="mt-7 min-h-5">
        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : displayedPage ? (
          <p className="text-sm text-muted">
            {t("workoutCount", { count: displayedPage.total })}
          </p>
        ) : (
          <p className="text-sm text-muted">{t("loading")}</p>
        )}
      </div>

      {displayedWorkouts.length === 0 && !isLoading ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-10 text-center sm:px-6 sm:py-16">
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
        <>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {displayedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                canManage={workout.canManage}
                preferredWorkoutLevelKey={preferredWorkoutLevelKey}
              />
            ))}
          </div>
          {displayedPage?.hasNextPage ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isLoading}
                onClick={() => void loadMore()}
              >
                {isLoading
                  ? t("loading")
                  : paginationT("loadMore", {
                      count: Math.min(
                        displayedPage.pageSize,
                        displayedPage.total - displayedWorkouts.length,
                      ),
                    })}
              </Button>
              <p className="text-xs text-muted" aria-live="polite">
                {paginationT("showing", {
                  shown: displayedWorkouts.length,
                  total: displayedPage.total,
                })}
              </p>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

function createQuery(
  view: LibraryView,
  filter: Filter,
  search: string,
  page: number,
  pageSize: number,
) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (view === "ARCHIVED") query.set("view", "archived");
  if (filter === "BENCHMARK") query.set("benchmark", "true");
  if (search) query.set("search", search);
  return query;
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
        "shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition",
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
        "min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
