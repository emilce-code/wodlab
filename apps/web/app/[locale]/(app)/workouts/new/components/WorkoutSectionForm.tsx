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
  fieldErrors,
  onChange,
  onRemove,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

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
    onChange({
      ...section,
      movements: [...section.movements, createEmptyMovement()],
    });
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
    <section className="min-w-0 w-full rounded-xl border border-border bg-surface p-3 sm:p-6 [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t("section", {
              number: sectionNumber,
            })}
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
      </div>

      {!displayedIsExpanded && (
        <p className="mt-4 text-sm text-muted">
          {t("summary", {
            movements: section.movements.length,
          })}
        </p>
      )}

      {displayedIsExpanded && (
        <div id={contentId} className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <div className="min-w-0 md:col-span-2">
            <label
              htmlFor={`section-type-${section.id}`}
              className="mb-1.5 block text-sm font-medium"
            >
              {t("sectionType")}
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
              <h4 className="font-semibold">{t("movements")}</h4>

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
                {section.movements.map((movement, index) => (
                  <div key={movement.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {t("movementNumber", {
                          number: index + 1,
                        })}
                      </span>
                    </div>

                    <WorkoutMovementForm
                      movement={movement}
                      prescriptionCategories={prescriptionCategories}
                      canRemove
                      autoFocusSearch={
                        index === section.movements.length - 1 &&
                        !movement.movementId
                      }
                      error={fieldErrors[`movement-search-${movement.id}`]}
                      onChange={(updatedMovement) =>
                        updateMovement(movement.id, updatedMovement)
                      }
                      onRemove={() => removeMovement(movement.id)}
                    />
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

          <div className="min-w-0 md:col-span-2">
            <div className="my-2 border-t border-border" />

            <label
              htmlFor={`section-notes-${section.id}`}
              className="mb-1.5 mt-6 block text-sm font-medium"
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
        </div>
      )}
    </section>
  );
}
