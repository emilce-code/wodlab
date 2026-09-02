"use client";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import type { PrescriptionCategory } from "../page";

export type MovementOption = {
  id: string;
  name: string;
  aliases: string[];

  category: {
    key: string;
    name: string;
  };

  measurementTypes: {
    key: string;
    name: string;
  }[];
};

export type WorkoutMovementPrescriptionFormState = {
  categoryKey: string;
  reps: string;
  weight: string;
  weightUnit: "KG" | "LB" | "";
  distance: string;
  calories: string;
  durationSeconds: string;
  notes: string;
};

export type WorkoutMovementFormState = {
  id: string;
  movementId: string;
  movementName: string;
  movementOption: MovementOption | null;

  reps: string;
  weight: string;
  weightUnit: "KG" | "LB" | "";
  distance: string;
  calories: string;
  durationSeconds: string;
  notes: string;

  prescriptions: WorkoutMovementPrescriptionFormState[];
};

type Props = {
  movement: WorkoutMovementFormState;
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  autoFocusSearch?: boolean;
  error?: string;
  onChange: (movement: WorkoutMovementFormState) => void;
  onRemove: () => void;
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </svg>
  );
}

export default function WorkoutMovementForm({
  movement,
  prescriptionCategories,
  canRemove,
  autoFocusSearch = false,
  error,
  onChange,
  onRemove,
}: Props) {
  const t = useTranslations("workouts.create.movementBuilder");

  const [search, setSearch] = useState(movement.movementName);

  const [results, setResults] = useState<MovementOption[]>([]);

  const [isSearching, setIsSearching] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);

  const [activeResultIndex, setActiveResultIndex] = useState(0);

  const selectedMovement = movement.movementOption;

  const normalizedSearch = search.trim();

  const hasSearchQuery = normalizedSearch.length >= 2;

  const displayedResults = hasSearchQuery ? results : [];

  const displayedIsSearching = hasSearchQuery && isSearching;

  const displayedSearchError = hasSearchQuery ? searchError : null;

  useEffect(() => {
    if (movement.movementId && normalizedSearch === movement.movementName) {
      return;
    }

    if (normalizedSearch.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/movements?search=${encodeURIComponent(normalizedSearch)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Unable to search movements");
        }

        const data = (await response.json()) as MovementOption[];

        setResults(data);
        setActiveResultIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);

        setSearchError(t("searchError"));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedSearch, movement.movementId, movement.movementName, t]);

  function update(field: keyof WorkoutMovementFormState, value: string) {
    onChange({
      ...movement,
      [field]: value,
    });
  }

  function clearPrescriptionFields() {
    return {
      reps: "",
      weight: "",
      weightUnit: "" as const,
      distance: "",
      calories: "",
      durationSeconds: "",
      prescriptions: [],
    };
  }

  function selectMovement(option: MovementOption) {
    setSearch(option.name);
    setResults([]);
    setSearchError(null);

    onChange({
      ...movement,
      movementId: option.id,
      movementName: option.name,
      movementOption: option,
      ...clearPrescriptionFields(),
    });
  }

  function clearSelectedMovement() {
    setSearch("");
    setResults([]);
    setSearchError(null);

    onChange({
      ...movement,
      movementId: "",
      movementName: "",
      movementOption: null,
      ...clearPrescriptionFields(),
    });
  }

  function hasPrescription(categoryKey: string) {
    return movement.prescriptions.some(
      (prescription) => prescription.categoryKey === categoryKey,
    );
  }

  function togglePrescription(categoryKey: string) {
    if (hasPrescription(categoryKey)) {
      onChange({
        ...movement,
        prescriptions: movement.prescriptions.filter(
          (prescription) => prescription.categoryKey !== categoryKey,
        ),
      });
      return;
    }

    onChange({
      ...movement,
      prescriptions: [
        ...movement.prescriptions,
        {
          categoryKey,
          reps: "",
          weight: "",
          weightUnit: "",
          distance: "",
          calories: "",
          durationSeconds: "",
          notes: "",
        },
      ],
    });
  }

  function updatePrescription(
    categoryKey: string,
    field:
      | "reps"
      | "weight"
      | "weightUnit"
      | "distance"
      | "calories"
      | "durationSeconds"
      | "notes",
    value: string,
  ) {
    onChange({
      ...movement,
      prescriptions: movement.prescriptions.map((prescription) =>
        prescription.categoryKey === categoryKey
          ? {
              ...prescription,
              [field]: value,
            }
          : prescription,
      ),
    });
  }

  const supportsReps =
    selectedMovement?.measurementTypes.some((type) => type.key === "REPS") ??
    false;

  const supportsWeight =
    selectedMovement?.measurementTypes.some((type) => type.key === "WEIGHT") ??
    false;

  const supportsDistance =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === "DISTANCE",
    ) ?? false;

  const supportsCalories =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === "CALORIES",
    ) ?? false;

  const supportsDuration =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === "DURATION",
    ) ?? false;

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (displayedResults.length === 0) {
      if (event.key === "Escape") {
        setResults([]);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((current) =>
        Math.min(current + 1, displayedResults.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectMovement(displayedResults[activeResultIndex]);
      return;
    }

    if (event.key === "Escape") {
      setResults([]);
    }
  }

  return (
    <div className="min-w-0 w-full rounded-xl border border-border bg-background p-2.5 sm:p-4 [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 block text-sm font-medium">{t("movement")}</p>

          {movement.movementId ? (
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-3 sm:gap-4 sm:px-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {movement.movementName}
                </p>

                {selectedMovement && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {selectedMovement.category.name}
                    </span>

                    {selectedMovement.aliases.length > 0 && (
                      <span className="text-xs text-muted">
                        · {selectedMovement.aliases.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={clearSelectedMovement}
                aria-label={t("change")}
                title={t("change")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground sm:h-auto sm:w-auto sm:rounded-none"
              >
                <span
                  aria-hidden="true"
                  className="text-lg leading-none sm:hidden"
                >
                  ↻
                </span>
                <span className="hidden sm:inline">{t("change")}</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                ⌕
              </span>

              <input
                id={`movement-search-${movement.id}`}
                type="search"
                autoFocus={autoFocusSearch}
                value={search}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={displayedResults.length > 0}
                aria-controls={`movement-results-${movement.id}`}
                aria-activedescendant={
                  displayedResults.length > 0
                    ? `movement-result-${displayedResults[activeResultIndex].id}`
                    : undefined
                }
                onKeyDown={handleSearchKeyDown}
                onChange={(event) => {
                  setSearch(event.target.value);

                  if (event.target.value !== movement.movementName) {
                    onChange({
                      ...movement,
                      movementId: "",
                      movementName: "",
                      movementOption: null,
                      ...clearPrescriptionFields(),
                    });
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? `movement-search-${movement.id}-error` : undefined
                }
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
              />

              {error ? (
                <p
                  id={`movement-search-${movement.id}-error`}
                  className="mt-1.5 text-sm text-red-500"
                >
                  {error}
                </p>
              ) : null}

              {(displayedIsSearching ||
                displayedSearchError ||
                hasSearchQuery ||
                displayedResults.length > 0) && (
                <div
                  id={`movement-results-${movement.id}`}
                  role="listbox"
                  className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
                >
                  {displayedIsSearching && (
                    <div className="px-4 py-3 text-sm text-muted">
                      {t("searching")}
                    </div>
                  )}

                  {!displayedIsSearching && displayedSearchError && (
                    <div className="px-4 py-3 text-sm text-red-500">
                      {displayedSearchError}
                    </div>
                  )}

                  {!displayedIsSearching &&
                    !displayedSearchError &&
                    displayedResults.length === 0 &&
                    search.trim().length >= 2 && (
                      <div className="px-4 py-3 text-sm text-muted">
                        {t("noResults")}
                      </div>
                    )}

                  {!displayedIsSearching &&
                    displayedResults.map((option, index) => (
                      <button
                        key={option.id}
                        id={`movement-result-${option.id}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeResultIndex}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onClick={() => selectMovement(option)}
                        className={
                          index === activeResultIndex
                            ? "block w-full border-b border-border bg-surface-elevated px-4 py-3 text-left transition last:border-b-0"
                            : "block w-full border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-surface-elevated"
                        }
                      >
                        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold">{option.name}</p>

                            <p className="mt-1 text-xs text-muted">
                              {option.category.name}
                            </p>
                          </div>

                          {option.aliases.length > 0 && (
                            <span className="hidden shrink-0 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted sm:inline">
                              {option.aliases.join(" · ")}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("remove")}
            title={t("remove")}
            className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-muted transition hover:bg-red-500/10 hover:text-red-500 sm:h-auto sm:w-auto sm:rounded-none"
          >
            <span className="sm:hidden">
              <TrashIcon />
            </span>
            <span className="hidden sm:inline">{t("remove")}</span>
          </button>
        )}
      </div>

      {selectedMovement && (
        <>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t("prescription")}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {supportsReps && (
                <div>
                  <label
                    htmlFor={`movement-reps-${movement.id}`}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("reps")}
                  </label>

                  <input
                    id={`movement-reps-${movement.id}`}
                    type="number"
                    min="1"
                    value={movement.reps}
                    onChange={(event) => update("reps", event.target.value)}
                    placeholder="10"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              )}

              {supportsWeight && (
                <>
                  <div>
                    <label
                      htmlFor={`movement-weight-${movement.id}`}
                      className="mb-1.5 block text-sm font-medium"
                    >
                      {t("weight")}
                    </label>

                    <input
                      id={`movement-weight-${movement.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={movement.weight}
                      onChange={(event) => update("weight", event.target.value)}
                      placeholder="43"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`movement-unit-${movement.id}`}
                      className="mb-1.5 block text-sm font-medium"
                    >
                      {t("unit")}
                    </label>

                    <select
                      id={`movement-unit-${movement.id}`}
                      value={movement.weightUnit}
                      onChange={(event) =>
                        update("weightUnit", event.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    >
                      <option value="">{t("selectUnit")}</option>

                      <option value="KG">KG</option>

                      <option value="LB">LB</option>
                    </select>
                  </div>
                </>
              )}

              {supportsDistance && (
                <div>
                  <label
                    htmlFor={`movement-distance-${movement.id}`}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("distance")}
                  </label>

                  <div className="relative">
                    <input
                      id={`movement-distance-${movement.id}`}
                      type="number"
                      min="0"
                      value={movement.distance}
                      onChange={(event) =>
                        update("distance", event.target.value)
                      }
                      placeholder="500"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      m
                    </span>
                  </div>
                </div>
              )}

              {supportsCalories && (
                <div>
                  <label
                    htmlFor={`movement-calories-${movement.id}`}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("calories")}
                  </label>

                  <div className="relative">
                    <input
                      id={`movement-calories-${movement.id}`}
                      type="number"
                      min="0"
                      value={movement.calories}
                      onChange={(event) =>
                        update("calories", event.target.value)
                      }
                      placeholder="15"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-12 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      cal
                    </span>
                  </div>
                </div>
              )}

              {supportsDuration && (
                <div>
                  <label
                    htmlFor={`movement-duration-${movement.id}`}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("duration")}
                  </label>

                  <div className="relative">
                    <input
                      id={`movement-duration-${movement.id}`}
                      type="number"
                      min="0"
                      value={movement.durationSeconds}
                      onChange={(event) =>
                        update("durationSeconds", event.target.value)
                      }
                      placeholder="30"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-16 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      {t("secondsShort")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {prescriptionCategories.length > 0 && (
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {t("categoryPrescriptions")}
              </p>

              <p className="mt-1 text-xs text-muted">
                {t("categoryPrescriptionsDescription")}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {prescriptionCategories.map((category) => {
                  const enabled = hasPrescription(category.key);

                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => togglePrescription(category.key)}
                      className={
                        enabled
                          ? "max-w-full whitespace-normal break-words rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-left text-sm font-semibold text-accent"
                          : "max-w-full whitespace-normal break-words rounded-full border border-border bg-surface px-3 py-1.5 text-left text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-foreground"
                      }
                    >
                      {enabled ? "✓ " : "+ "}
                      {category.name}
                    </button>
                  );
                })}
              </div>

              {movement.prescriptions.length > 0 && (
                <div className="mt-5 space-y-4">
                  {movement.prescriptions.map((prescription) => {
                    const category = prescriptionCategories.find(
                      (item) => item.key === prescription.categoryKey,
                    );

                    if (!category) {
                      return null;
                    }

                    return (
                      <div
                        key={prescription.categoryKey}
                        className="min-w-0 rounded-xl border border-border bg-surface p-2.5 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <h5 className="font-semibold">{category.name}</h5>

                            {category.description && (
                              <p className="mt-1 text-xs text-muted">
                                {category.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => togglePrescription(category.key)}
                            aria-label={t("removeCategoryPrescription")}
                            title={t("removeCategoryPrescription")}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-medium text-muted transition hover:bg-red-500/10 hover:text-red-500 sm:h-auto sm:w-auto sm:rounded-none"
                          >
                            <span className="sm:hidden">
                              <TrashIcon />
                            </span>
                            <span className="hidden sm:inline">
                              {t("removeCategoryPrescription")}
                            </span>
                          </button>
                        </div>

                        <p className="mt-3 text-xs text-muted">
                          {t("categoryFallbackHint")}
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {supportsReps && (
                            <div>
                              <label
                                htmlFor={`prescription-reps-${movement.id}-${category.key}`}
                                className="mb-1.5 block text-sm font-medium"
                              >
                                {t("reps")}
                              </label>

                              <input
                                id={`prescription-reps-${movement.id}-${category.key}`}
                                type="number"
                                min="1"
                                value={prescription.reps}
                                onChange={(event) =>
                                  updatePrescription(
                                    category.key,
                                    "reps",
                                    event.target.value,
                                  )
                                }
                                placeholder={movement.reps || "10"}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              />
                            </div>
                          )}

                          {supportsWeight && (
                            <>
                              <div>
                                <label
                                  htmlFor={`prescription-weight-${movement.id}-${category.key}`}
                                  className="mb-1.5 block text-sm font-medium"
                                >
                                  {t("weight")}
                                </label>

                                <input
                                  id={`prescription-weight-${movement.id}-${category.key}`}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={prescription.weight}
                                  onChange={(event) =>
                                    updatePrescription(
                                      category.key,
                                      "weight",
                                      event.target.value,
                                    )
                                  }
                                  placeholder={movement.weight || "43"}
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`prescription-unit-${movement.id}-${category.key}`}
                                  className="mb-1.5 block text-sm font-medium"
                                >
                                  {t("unit")}
                                </label>

                                <select
                                  id={`prescription-unit-${movement.id}-${category.key}`}
                                  value={prescription.weightUnit}
                                  onChange={(event) =>
                                    updatePrescription(
                                      category.key,
                                      "weightUnit",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                >
                                  <option value="">
                                    {movement.weightUnit
                                      ? t("useSharedUnit", {
                                          unit: movement.weightUnit,
                                        })
                                      : t("selectUnit")}
                                  </option>

                                  <option value="KG">KG</option>

                                  <option value="LB">LB</option>
                                </select>
                              </div>
                            </>
                          )}

                          {supportsDistance && (
                            <div>
                              <label
                                htmlFor={`prescription-distance-${movement.id}-${category.key}`}
                                className="mb-1.5 block text-sm font-medium"
                              >
                                {t("distance")}
                              </label>

                              <input
                                id={`prescription-distance-${movement.id}-${category.key}`}
                                type="number"
                                min="0"
                                value={prescription.distance}
                                onChange={(event) =>
                                  updatePrescription(
                                    category.key,
                                    "distance",
                                    event.target.value,
                                  )
                                }
                                placeholder={movement.distance || "500"}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              />
                            </div>
                          )}

                          {supportsCalories && (
                            <div>
                              <label
                                htmlFor={`prescription-calories-${movement.id}-${category.key}`}
                                className="mb-1.5 block text-sm font-medium"
                              >
                                {t("calories")}
                              </label>

                              <input
                                id={`prescription-calories-${movement.id}-${category.key}`}
                                type="number"
                                min="0"
                                value={prescription.calories}
                                onChange={(event) =>
                                  updatePrescription(
                                    category.key,
                                    "calories",
                                    event.target.value,
                                  )
                                }
                                placeholder={movement.calories || "15"}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              />
                            </div>
                          )}

                          {supportsDuration && (
                            <div>
                              <label
                                htmlFor={`prescription-duration-${movement.id}-${category.key}`}
                                className="mb-1.5 block text-sm font-medium"
                              >
                                {t("duration")}
                              </label>

                              <input
                                id={`prescription-duration-${movement.id}-${category.key}`}
                                type="number"
                                min="0"
                                value={prescription.durationSeconds}
                                onChange={(event) =>
                                  updatePrescription(
                                    category.key,
                                    "durationSeconds",
                                    event.target.value,
                                  )
                                }
                                placeholder={movement.durationSeconds || "30"}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              />
                            </div>
                          )}

                          <div className="md:col-span-2">
                            <label
                              htmlFor={`prescription-notes-${movement.id}-${category.key}`}
                              className="mb-1.5 block text-sm font-medium"
                            >
                              {t("notes")}
                            </label>

                            <input
                              id={`prescription-notes-${movement.id}-${category.key}`}
                              type="text"
                              value={prescription.notes}
                              onChange={(event) =>
                                updatePrescription(
                                  category.key,
                                  "notes",
                                  event.target.value,
                                )
                              }
                              placeholder={t("categoryNotesPlaceholder")}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <label
              htmlFor={`movement-notes-${movement.id}`}
              className="mb-1.5 block text-sm font-medium"
            >
              {t("notes")}

              <span className="ml-1 font-normal text-muted">
                {t("optional")}
              </span>
            </label>

            <input
              id={`movement-notes-${movement.id}`}
              type="text"
              value={movement.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </>
      )}
    </div>
  );
}
