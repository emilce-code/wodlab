"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
import NavigationIcon from "@/components/layout/NavigationIcon";
import type { WorkoutOption } from "@/lib/boxes";

export default function ScheduleWorkoutPicker({
  options,
  selected,
  loading,
  error,
  disabled,
  onRetry,
  onSelect,
}: {
  options: WorkoutOption[];
  selected: WorkoutOption | null;
  loading: boolean;
  error: boolean;
  disabled: boolean;
  onRetry: () => void;
  onSelect: (workout: WorkoutOption | null) => void;
}) {
  const t = useTranslations("boxes.schedule");
  const levelT = useTranslations("workoutLevels.names");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  const filtered = options.filter((option) =>
    normalize(option.name).includes(normalize(query.trim())),
  );
  const context = (option: WorkoutOption) =>
    option.variants
      .map(
        (variant) =>
          variant.name ||
          (levelT.has(variant.level.key.toLowerCase())
            ? levelT(variant.level.key.toLowerCase())
            : variant.level.name),
      )
      .join(" · ");
  function choose(workout: WorkoutOption | null) {
    onSelect(workout);
    setOpen(false);
  }
  return (
    <div className="min-w-0 space-y-2">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
      >
        <NavigationIcon
          name="workouts"
          className="h-5 w-5 shrink-0 text-accent"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block break-words text-sm ${selected ? "font-semibold" : "text-muted"}`}
          >
            {selected?.name ?? t("chooseWorkout")}
          </span>
          {selected && context(selected) ? (
            <span className="mt-1 block break-words text-xs text-muted">
              {context(selected)}
            </span>
          ) : null}
        </span>
        <BoxDetailsIcon
          name="chevron"
          className="h-4 w-4 shrink-0 text-muted"
        />
      </button>
      {selected ? (
        <div className="flex flex-wrap gap-x-4">
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
          >
            {t("changeWorkout")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => onSelect(null)}
          >
            {t("removeWorkout")}
          </Button>
        </div>
      ) : null}
      {open ? (
        <BottomSheet
          title={t("pickerTitle")}
          desktopPanel
          initialFocusRef={search}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="sr-only">{t("searchWorkout")}</span>
              <input
                ref={search}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchWorkout")}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            <div
              className="max-h-[55dvh] overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-12rem)]"
              aria-busy={loading}
            >
              {loading ? (
                <p role="status" className="py-6 text-sm text-muted">
                  {t("loadingWorkouts")}
                </p>
              ) : error ? (
                <div role="alert" className="space-y-2 py-4">
                  <p className="text-sm text-red-400">{t("workoutError")}</p>
                  <Button type="button" variant="secondary" onClick={onRetry}>
                    {t("retry")}
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => choose(null)}
                    className="mb-2 min-h-11 w-full rounded-lg px-3 text-left text-sm text-muted hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {t("noWorkout")}
                  </button>
                  <ul className="space-y-2" aria-label={t("workoutResults")}>
                    {filtered.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          aria-pressed={selected?.id === option.id}
                          onClick={() => choose(option)}
                          className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent ${selected?.id === option.id ? "border-accent/50 bg-accent/5" : "border-border"}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm font-semibold">
                              {option.name}
                            </span>
                            {context(option) ? (
                              <span className="mt-1 block break-words text-xs text-muted">
                                {context(option)}
                              </span>
                            ) : null}
                          </span>
                          <BoxDetailsIcon
                            name="chevron"
                            className="h-4 w-4 shrink-0 text-muted"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!filtered.length ? (
                    <p role="status" className="py-6 text-sm text-muted">
                      {t(query.trim() ? "noMatches" : "noWorkouts")}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
