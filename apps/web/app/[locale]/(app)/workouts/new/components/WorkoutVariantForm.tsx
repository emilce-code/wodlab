"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import type { PrescriptionCategory, WorkoutLevel, WorkoutType } from "../page";
import type { WorkoutFormFieldErrors } from "./WorkoutForm";

import WorkoutSectionForm, {
  WorkoutSectionFormState,
} from "./WorkoutSectionForm";

export type WorkoutVariantFormState = {
  id: string;
  levelKey: string;
  name: string;
  notes: string;
  sections: WorkoutSectionFormState[];
};

type Props = {
  variant: WorkoutVariantFormState;
  variantNumber: number;
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
  usedLevelKeys: string[];
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  fieldErrors: WorkoutFormFieldErrors;
  onChange: (variant: WorkoutVariantFormState) => void;
  onRemove: () => void;
};

function createEmptySection(): WorkoutSectionFormState {
  return {
    id: crypto.randomUUID(),
    typeKey: "",
    rounds: "",
    durationSeconds: "",
    restSeconds: "",
    repScheme: "",
    notes: "",
    movements: [],
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

export default function WorkoutVariantForm({
  variant,
  variantNumber,
  workoutTypes,
  workoutLevels,
  usedLevelKeys,
  canRemove,
  fieldErrors,
  prescriptionCategories,
  onChange,
  onRemove,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const t = useTranslations("workouts.create.variants");

  const selectedLevel = workoutLevels.find(
    (level) => level.key === variant.levelKey,
  );

  const contentId = `workout-variant-${variant.id}`;
  const movementCount = variant.sections.reduce(
    (total, section) => total + section.movements.length,
    0,
  );
  const hasValidationErrors =
    Boolean(fieldErrors[`variant-level-${variant.id}`]) ||
    Boolean(fieldErrors[`variant-sections-${variant.id}`]) ||
    variant.sections.some(
      (section) =>
        Boolean(fieldErrors[`section-type-${section.id}`]) ||
        Boolean(fieldErrors[`section-movements-${section.id}`]) ||
        Boolean(fieldErrors[`section-rep-scheme-${section.id}`]) ||
        section.movements.some((movement) =>
          Boolean(fieldErrors[`movement-search-${movement.id}`]),
        ),
    );
  const displayedIsExpanded = isExpanded || hasValidationErrors;

  function update(field: keyof WorkoutVariantFormState, value: string) {
    onChange({
      ...variant,
      [field]: value,
    });
  }

  function addSection() {
    onChange({
      ...variant,
      sections: [...variant.sections, createEmptySection()],
    });
  }

  function removeSection(id: string) {
    if (variant.sections.length === 1) {
      return;
    }

    onChange({
      ...variant,
      sections: variant.sections.filter((section) => section.id !== id),
    });
  }

  function updateSection(id: string, updatedSection: WorkoutSectionFormState) {
    onChange({
      ...variant,
      sections: variant.sections.map((section) =>
        section.id === id ? updatedSection : section,
      ),
    });
  }

  return (
    <section className="min-w-0 w-full rounded-xl border border-border bg-surface p-3 sm:p-6 [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t("variant", {
              number: variantNumber,
            })}
          </p>

          <h3 className="mt-1 break-words text-lg font-bold">
            {selectedLevel?.name ?? t("configure")}
          </h3>

          {selectedLevel?.description && (
            <p className="mt-1 text-sm text-muted">
              {selectedLevel.description}
            </p>
          )}
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
            sections: variant.sections.length,
            movements: movementCount,
          })}
        </p>
      )}

      {displayedIsExpanded && (
        <div id={contentId} className="min-w-0">
          <div className="mt-6 grid min-w-0 gap-5">
            <div>
              <label
                htmlFor={`variant-level-${variant.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("level")}
              </label>

              <select
                id={`variant-level-${variant.id}`}
                required
                value={variant.levelKey}
                onChange={(event) => update("levelKey", event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
                aria-invalid={Boolean(
                  fieldErrors[`variant-level-${variant.id}`],
                )}
                aria-describedby={
                  fieldErrors[`variant-level-${variant.id}`]
                    ? `variant-level-${variant.id}-error`
                    : undefined
                }
              >
                <option value="">{t("selectLevel")}</option>

                {workoutLevels.map((level) => {
                  const disabled =
                    level.key !== variant.levelKey &&
                    usedLevelKeys.includes(level.key);

                  return (
                    <option
                      key={level.key}
                      value={level.key}
                      disabled={disabled}
                    >
                      {level.name}
                    </option>
                  );
                })}
              </select>
              {fieldErrors[`variant-level-${variant.id}`] ? (
                <p
                  id={`variant-level-${variant.id}-error`}
                  className="mt-1.5 text-sm text-red-500"
                >
                  {fieldErrors[`variant-level-${variant.id}`]}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor={`variant-name-${variant.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("name")}

                <span className="ml-1 font-normal text-muted">
                  {t("optional")}
                </span>
              </label>

              <input
                id={`variant-name-${variant.id}`}
                type="text"
                value={variant.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor={`variant-notes-${variant.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                {t("notes")}

                <span className="ml-1 font-normal text-muted">
                  {t("optional")}
                </span>
              </label>

              <textarea
                id={`variant-notes-${variant.id}`}
                rows={2}
                value={variant.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder={t("notesPlaceholder")}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="font-semibold">{t("sections")}</h4>

              <p className="mt-1 text-sm text-muted">
                {t("sectionsDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={addSection}
              aria-label={t("addSection")}
              title={t("addSection")}
              className="inline-flex h-10 w-10 self-end items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-elevated sm:h-auto sm:w-auto sm:self-auto sm:px-4 sm:py-2.5"
            >
              <span
                aria-hidden="true"
                className="text-xl leading-none sm:hidden"
              >
                +
              </span>
              <span className="hidden sm:inline">+ {t("addSection")}</span>
            </button>
          </div>

          <div
            id={`variant-sections-${variant.id}`}
            tabIndex={-1}
            className="mt-5 min-w-0 space-y-5"
          >
            {variant.sections.map((section, index) => (
              <WorkoutSectionForm
                key={section.id}
                section={section}
                sectionNumber={index + 1}
                workoutTypes={workoutTypes}
                canRemove={variant.sections.length > 1}
                prescriptionCategories={prescriptionCategories}
                fieldErrors={fieldErrors}
                onChange={(updatedSection) =>
                  updateSection(section.id, updatedSection)
                }
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
