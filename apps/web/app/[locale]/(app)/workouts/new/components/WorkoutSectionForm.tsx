"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import type { PrescriptionCategory } from "../page";
import type { WorkoutFormFieldErrors } from "./WorkoutForm";

import WorkoutMovementForm, {
  WorkoutMovementFormState,
} from "./WorkoutMovementForm";

export type WorkoutSectionFormState = {
  id: string;
  typeKey: string;
  rounds: string;
  durationSeconds: string;
  restSeconds: string;
  repScheme: string;
  notes: string;
  movements: WorkoutMovementFormState[];
};

type WorkoutType = {
  key: string;
  name: string;
  description: string | null;
};

type Props = {
  section: WorkoutSectionFormState;
  sectionNumber: number;
  workoutTypes: WorkoutType[];
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  advancedMode: boolean;
  simpleMode?: boolean;
  initiallyExpanded?: boolean;
  fieldErrors: WorkoutFormFieldErrors;
  onChange: (section: WorkoutSectionFormState) => void;
  onRemove: () => void;
};

function createEmptyMovement(): WorkoutMovementFormState {
  return {
    id: crypto.randomUUID(),
    movementId: "",
    movementName: "",
    movementOption: null,
    reps: "",
    weight: "",
    weightUnit: "",
    percentage: "",
    referenceRepMax: "1",
    distance: "",
    calories: "",
    durationSeconds: "",
    notes: "",
    prescriptions: [],
  };
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
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
      <path d={expanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

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

export default function WorkoutSectionForm({
  section,
  sectionNumber,
  workoutTypes,
  prescriptionCategories,
  canRemove,
  advancedMode,
  simpleMode = false,
  initiallyExpanded = true,
  fieldErrors,
  onChange,
  onRemove,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);

  const [showOptionalDetails, setShowOptionalDetails] = useState(
    Boolean(section.notes),
  );

  const t = useTranslations("workouts.create.sectionBuilder");

  const typeT = useTranslations("workoutTypes");

  const sectionType = section.typeKey;

  const selectedSectionType = workoutTypes.find(
    (type) => type.key === sectionType,
  );

  const contentId = `workout-section-${section.id}`;
  const hasValidationErrors =
    Boolean(fieldErrors[`section-type-${section.id}`]) ||
    Boolean(fieldErrors[`section-movements-${section.id}`]) ||
    Boolean(fieldErrors[`section-rep-scheme-${section.id}`]) ||
    section.movements.some((movement) =>
      Boolean(fieldErrors[`movement-search-${movement.id}`]),
    );
  const displayedIsExpanded = isExpanded || hasValidationErrors;
  const sectionSummary = [
    selectedSectionType ? getWorkoutTypeName(selectedSectionType) : null,
    section.durationSeconds
      ? `${Number(section.durationSeconds) / 60} ${t("minutes")}`
      : null,
    section.rounds
      ? `${section.rounds} ${
          sectionType === "STRENGTH" ? t("sets") : t("rounds")
        }`
      : null,
    section.movements.length
      ? t("summary", { movements: section.movements.length })
      : null,
  ].filter(Boolean);

  const showRounds =
    sectionType === "STRENGTH" ||
    sectionType === "INTERVAL" ||
    sectionType === "CUSTOM";

  const showDuration =
    sectionType === "AMRAP" ||
    sectionType === "EMOM" ||
    sectionType === "INTERVAL" ||
    sectionType === "CUSTOM";

  const showRest = sectionType === "INTERVAL" || sectionType === "CUSTOM";

  const showRepScheme =
    sectionType === "FOR_TIME" ||
    sectionType === "MAX_REPS" ||
    sectionType === "CUSTOM";

  function getWorkoutTypeName(type: WorkoutType) {
    const key = type.key.toLowerCase();

    return typeT.has(key) ? typeT(key) : type.name;
  }

  function update(field: keyof WorkoutSectionFormState, value: string) {
    onChange({
      ...section,
      [field]: value,
    });
  }

  function changeSectionType(typeKey: string) {
    const nextSection: WorkoutSectionFormState = {
      ...section,
      typeKey,
    };

    if (
      typeKey !== "STRENGTH" &&
      typeKey !== "INTERVAL" &&
      typeKey !== "CUSTOM"
    ) {
      nextSection.rounds = "";
    }

    if (
      typeKey !== "AMRAP" &&
      typeKey !== "EMOM" &&
      typeKey !== "INTERVAL" &&
      typeKey !== "CUSTOM"
    ) {
      nextSection.durationSeconds = "";
    }

    if (typeKey !== "INTERVAL" && typeKey !== "CUSTOM") {
      nextSection.restSeconds = "";
    }

    if (
      typeKey !== "FOR_TIME" &&
      typeKey !== "MAX_REPS" &&
      typeKey !== "CUSTOM"
    ) {
      nextSection.repScheme = "";
    }

    onChange(nextSection);
  }

  function addMovement() {
    const movement = createEmptyMovement();
    onChange({ ...section, movements: [...section.movements, movement] });
    if (simpleMode) setEditingMovementId(movement.id);
  }

  function moveMovement(id: string, direction: -1 | 1) {
    const index = section.movements.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= section.movements.length) return;
    const movements = [...section.movements];
    [movements[index], movements[nextIndex]] = [movements[nextIndex], movements[index]];
    onChange({ ...section, movements });
  }

  function removeMovement(id: string) {
    onChange({
      ...section,
      movements: section.movements.filter((movement) => movement.id !== id),
    });
  }

  function updateMovement(
    id: string,
    updatedMovement: WorkoutMovementFormState,
  ) {
    onChange({
      ...section,
      movements: section.movements.map((movement) =>
        movement.id === id ? updatedMovement : movement,
      ),
    });
  }

  return (
    <section className={`min-w-0 w-full ${simpleMode ? "" : "rounded-xl border border-border bg-background p-3 sm:p-6"} [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full`}>
      {!simpleMode ? <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-[11px]">
              {sectionNumber}
            </span>
            {t("sectionLabel")}
          </p>

          <h3 className="mt-1 break-words text-lg font-bold">
            {selectedSectionType
              ? getWorkoutTypeName(selectedSectionType)
              : t("configureSection")}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={displayedIsExpanded}
            aria-controls={contentId}
            aria-label={displayedIsExpanded ? t("collapse") : t("expand")}
            title={displayedIsExpanded ? t("collapse") : t("expand")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-elevated sm:h-auto sm:w-auto sm:px-3 sm:py-2"
          >
            <span className="sm:hidden">
              <ChevronIcon expanded={displayedIsExpanded} />
            </span>
            <span className="hidden sm:inline">
              {displayedIsExpanded ? t("collapse") : t("expand")}
            </span>
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={t("remove")}
              title={t("remove")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-muted transition hover:bg-red-500/10 hover:text-red-500 sm:h-auto sm:w-auto sm:rounded-none"
            >
              <span className="sm:hidden">
                <TrashIcon />
              </span>
              <span className="hidden sm:inline">{t("remove")}</span>
            </button>
          )}
        </div>
      </div> : null}

      {!simpleMode && !displayedIsExpanded && (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {sectionSummary.length
              ? sectionSummary.join(" · ")
              : t("summary", { movements: section.movements.length })}
          </p>
          {section.movements.length > 0 ? (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
              {section.movements.slice(0, 4).map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {movement.movementName || t("unselectedMovement")}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {movement.reps
                      ? `${movement.reps} ${t("reps")}`
                      : t("tapToEdit")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {(simpleMode || displayedIsExpanded) && (
        <div id={contentId} className={`${simpleMode ? "mt-0" : "mt-6"} grid min-w-0 gap-5 md:grid-cols-2`}>
          <div className="min-w-0 md:col-span-2">
            <label
              htmlFor={`section-type-${section.id}`}
              className="mb-1.5 block text-sm font-medium"
            >
              {simpleMode ? t("workoutType") : t("sectionType")} *
            </label>

            <select
              id={`section-type-${section.id}`}
              required
              value={section.typeKey}
              onChange={(event) => changeSectionType(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
              aria-invalid={Boolean(fieldErrors[`section-type-${section.id}`])}
              aria-describedby={
                fieldErrors[`section-type-${section.id}`]
                  ? `section-type-${section.id}-error`
                  : undefined
              }
            >
              <option value="">{t("selectSectionType")}</option>

              {workoutTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {getWorkoutTypeName(type)}
                </option>
              ))}
            </select>
            {fieldErrors[`section-type-${section.id}`] ? (
              <p
                id={`section-type-${section.id}-error`}
                className="mt-1.5 text-sm text-red-500"
              >
                {fieldErrors[`section-type-${section.id}`]}
              </p>
            ) : null}

            {selectedSectionType?.description && (
              <p className="mt-2 text-xs text-muted">
                {selectedSectionType.description}
              </p>
            )}
          </div>

          {showRounds && (
            <div>
              <label
                htmlFor={`section-rounds-${section.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {sectionType === "STRENGTH" ? t("sets") : t("rounds")}
              </label>

              <input
                id={`section-rounds-${section.id}`}
                type="number"
                min="1"
                value={section.rounds}
                onChange={(event) => update("rounds", event.target.value)}
                placeholder={sectionType === "STRENGTH" ? "5" : "3"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
              />
            </div>
          )}

          {showDuration && (
            <div>
              <label
                htmlFor={`section-duration-${section.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("duration")}
              </label>

              <div className="relative">
                <input
                  id={`section-duration-${section.id}`}
                  type="number"
                  min="1"
                  value={
                    section.durationSeconds
                      ? Number(section.durationSeconds) / 60
                      : ""
                  }
                  onChange={(event) => {
                    const minutes = event.target.value;

                    update(
                      "durationSeconds",
                      minutes ? String(Number(minutes) * 60) : "",
                    );
                  }}
                  placeholder="20"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-20 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {t("minutes")}
                </span>
              </div>
            </div>
          )}

          {showRest && (
            <div>
              <label
                htmlFor={`section-rest-${section.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("rest")}
              </label>

              <div className="relative">
                <input
                  id={`section-rest-${section.id}`}
                  type="number"
                  min="0"
                  value={section.restSeconds}
                  onChange={(event) =>
                    update("restSeconds", event.target.value)
                  }
                  placeholder="60"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-20 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {t("seconds")}
                </span>
              </div>
            </div>
          )}

          {showRepScheme && (
            <div className="md:col-span-2">
              <label
                htmlFor={`section-rep-scheme-${section.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("repScheme")}
              </label>

              <input
                id={`section-rep-scheme-${section.id}`}
                type="text"
                value={section.repScheme}
                onChange={(event) => update("repScheme", event.target.value)}
                placeholder="21-15-9"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                aria-invalid={Boolean(
                  fieldErrors[`section-rep-scheme-${section.id}`],
                )}
                aria-describedby={
                  fieldErrors[`section-rep-scheme-${section.id}`]
                    ? `section-rep-scheme-${section.id}-error`
                    : undefined
                }
              />

              <p className="mt-2 text-xs text-muted">{t("repSchemeHelp")}</p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                aria-label={t("repPresets")}
              >
                {["21-15-9", "15-12-9", "10-8-6-4-2", "5-5-5-5-5"].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => update("repScheme", preset)}
                      aria-pressed={section.repScheme === preset}
                      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        section.repScheme === preset
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background text-muted hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ),
                )}
              </div>
              {fieldErrors[`section-rep-scheme-${section.id}`] ? (
                <p
                  id={`section-rep-scheme-${section.id}-error`}
                  className="mt-1.5 text-sm text-red-500"
                >
                  {fieldErrors[`section-rep-scheme-${section.id}`]}
                </p>
              ) : null}
            </div>
          )}

          <div className="min-w-0 md:col-span-2">
            <div className="my-2 border-t border-border" />

            <div className="mt-6">
              <h4 className="font-semibold">{t("movements")} *</h4>

              <p className="mt-1 text-sm text-muted">
                {t("movementsDescription")}
              </p>
            </div>

            {section.movements.length === 0 ? (
              <div id={`section-movements-${section.id}`} tabIndex={-1}>
                <button
                  type="button"
                  onClick={addMovement}
                  aria-label={t("addMovement")}
                  title={t("addMovement")}
                  className={`mt-5 block w-full rounded-xl border border-dashed px-6 py-8 text-center transition hover:border-accent/40 hover:bg-surface-elevated ${
                    fieldErrors[`section-movements-${section.id}`]
                      ? "border-red-500 bg-red-500/5"
                      : "border-border"
                  }`}
                  aria-describedby={
                    fieldErrors[`section-movements-${section.id}`]
                      ? `section-movements-${section.id}-error`
                      : undefined
                  }
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-semibold text-accent">
                    +
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {t("noMovements")}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {t("noMovementsDescription")}
                  </p>
                </button>
                {fieldErrors[`section-movements-${section.id}`] ? (
                  <p
                    id={`section-movements-${section.id}-error`}
                    className="mt-1.5 text-sm text-red-500"
                  >
                    {fieldErrors[`section-movements-${section.id}`]}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 min-w-0 space-y-4">
                {simpleMode ? section.movements.map((movement, index) => (
                  <div key={movement.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-2.5">
                    <div className="flex shrink-0 flex-col" aria-label={t("reorderMovement")}>
                      <button type="button" disabled={index === 0} onClick={() => moveMovement(movement.id, -1)} className="h-5 px-1 text-xs text-muted disabled:opacity-20">▲</button>
                      <button type="button" disabled={index === section.movements.length - 1} onClick={() => moveMovement(movement.id, 1)} className="h-5 px-1 text-xs text-muted disabled:opacity-20">▼</button>
                    </div>
                    <button type="button" onClick={() => setEditingMovementId(movement.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-semibold">{movement.movementName || t("unselectedMovement")}</span>
                      <span className="block truncate text-xs text-muted">{[movement.reps && `${movement.reps} ${t("reps")}`, movement.weight && `${movement.weight} ${movement.weightUnit}`, movement.distance && `${movement.distance} m`, movement.calories && `${movement.calories} cal`].filter(Boolean).join(" · ") || t("tapToEdit")}</span>
                    </button>
                    <button type="button" onClick={() => setEditingMovementId(movement.id)} aria-label={t("editMovement")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground">✎</button>
                    <button type="button" onClick={() => removeMovement(movement.id)} aria-label={t("remove")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500"><TrashIcon /></button>
                  </div>
                )) : section.movements.map((movement, index) => (
                  <div key={movement.id}>
                    <div className="mb-2 flex items-center gap-2"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">{t("movementNumber", { number: index + 1 })}</span></div>
                    <WorkoutMovementForm movement={movement} prescriptionCategories={prescriptionCategories} advancedMode={advancedMode} canRemove autoFocusSearch={index === section.movements.length - 1 && !movement.movementId} error={fieldErrors[`movement-search-${movement.id}`]} onChange={(updatedMovement) => updateMovement(movement.id, updatedMovement)} onRemove={() => removeMovement(movement.id)} />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMovement}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-dashed border-border px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent/40 hover:bg-surface-elevated hover:text-foreground"
                >
                  + {t("addAnotherMovement")}
                </button>
              </div>
            )}
          </div>

          {advancedMode ? (
            <details
              open={showOptionalDetails}
              onToggle={(event) =>
                setShowOptionalDetails(event.currentTarget.open)
              }
              className="group min-w-0 rounded-xl border border-dashed border-border bg-background md:col-span-2"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold marker:content-none">
                <span>{t("optionalDetails")}</span>
                <span
                  aria-hidden="true"
                  className="text-lg text-muted transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-border p-4">
                <label
                  htmlFor={`section-notes-${section.id}`}
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("notes")}

                  <span className="ml-1 font-normal text-muted">
                    {t("optional")}
                  </span>
                </label>

                <textarea
                  id={`section-notes-${section.id}`}
                  rows={3}
                  value={section.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </details>
          ) : null}
        </div>
      )}
      {simpleMode && editingMovementId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-4 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{t("editMovement")}</h3>
              <button type="button" onClick={() => setEditingMovementId(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl text-muted hover:bg-surface-elevated">×</button>
            </div>
            {section.movements.filter((movement) => movement.id === editingMovementId).map((movement) => (
              <WorkoutMovementForm key={movement.id} movement={movement} prescriptionCategories={prescriptionCategories} advancedMode={false} canRemove={false} autoFocusSearch={!movement.movementId} error={fieldErrors[`movement-search-${movement.id}`]} onChange={(updatedMovement) => updateMovement(movement.id, updatedMovement)} onRemove={() => undefined} />
            ))}
            <button type="button" onClick={() => setEditingMovementId(null)} className="sticky bottom-0 mt-5 w-full rounded-xl bg-accent px-4 py-3 font-bold text-accent-foreground shadow-lg">{t("saveMovement")}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
