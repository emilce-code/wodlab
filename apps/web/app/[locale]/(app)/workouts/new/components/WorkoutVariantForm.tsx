"use client";

import { useRef, useState } from "react";

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
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
  usedLevelKeys: string[];
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  advancedMode: boolean;
  initiallyExpanded?: boolean;
  expandSectionsByDefault?: boolean;
  fieldErrors: WorkoutFormFieldErrors;
  onChange: (variant: WorkoutVariantFormState) => void;
  onRemove: () => void;
};

function createEmptySection(): WorkoutSectionFormState {
  return {
    id: crypto.randomUUID(),
    typeKey: "",
    role: "WOD",
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
  workoutTypes,
  workoutLevels,
  usedLevelKeys,
  canRemove,
  advancedMode,
  initiallyExpanded = true,
  expandSectionsByDefault = false,
  fieldErrors,
  prescriptionCategories,
  onChange,
  onRemove,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<WorkoutSectionFormState | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const sectionPointerId = useRef<number | null>(null);

  const [showOptionalDetails, setShowOptionalDetails] = useState(
    Boolean(variant.name || variant.notes),
  );

  const t = useTranslations("workouts.create.variants");
  const levelT = useTranslations("workoutLevels");

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
    const section = createEmptySection();
    setSectionDraft(section);
    setEditingSectionId(section.id);
    setIsAddingSection(true);
  }

  function editSection(section: WorkoutSectionFormState) {
    setSectionDraft({
      ...section,
      movements: section.movements.map((movement) => ({
        ...movement,
        prescriptions: movement.prescriptions.map((item) => ({ ...item })),
      })),
    });
    setEditingSectionId(section.id);
    setIsAddingSection(false);
  }

  function cancelSectionEditor() {
    setSectionDraft(null);
    setEditingSectionId(null);
    setIsAddingSection(false);
  }

  function confirmSectionEditor() {
    if (!sectionDraft?.typeKey || sectionDraft.movements.length === 0) return;
    if (isAddingSection) {
      onChange({ ...variant, sections: [...variant.sections, sectionDraft] });
    } else {
      updateSection(sectionDraft.id, sectionDraft);
    }
    cancelSectionEditor();
  }

  function reorderSection(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const fromIndex = variant.sections.findIndex((item) => item.id === draggedId);
    const toIndex = variant.sections.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const sections = [...variant.sections];
    const [dragged] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, dragged);
    onChange({ ...variant, sections });
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

  if (!advancedMode) {
    const section = variant.sections[0] ?? createEmptySection();

    return (
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t("configure")}
          </p>
          <h2 className="mt-1 text-xl font-bold">{t("singleBuilderTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("singleBuilderDescription")}</p>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium">{t("level")} *</label>
          <div id={`variant-level-${variant.id}`} role="radiogroup" aria-label={t("level")} className="flex flex-wrap gap-2">
            {workoutLevels.map((level) => {
              const isSelected = level.key === variant.levelKey;
              return (
                <button key={level.key} type="button" role="radio" aria-checked={isSelected}
                  onClick={() => update("levelKey", level.key)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${isSelected ? "border-accent bg-accent text-accent-foreground shadow-sm shadow-accent/25" : "border-border bg-background text-foreground hover:border-accent/40"}`}>
                  {levelT.has(`names.${level.key.toLowerCase()}`) ? levelT(`names.${level.key.toLowerCase()}`) : level.name}
                </button>
              );
            })}
          </div>
          {fieldErrors[`variant-level-${variant.id}`] ? (
            <p id={`variant-level-${variant.id}-error`} className="mt-1.5 text-sm text-red-500">{fieldErrors[`variant-level-${variant.id}`]}</p>
          ) : (
            <p className="mt-2 text-xs text-muted">{t("singleLevelHint")}</p>
          )}
        </div>

        <div className="mt-6">
          <WorkoutSectionForm
            section={section}
            sectionNumber={1}
            workoutTypes={workoutTypes}
            prescriptionCategories={prescriptionCategories}
            canRemove={false}
            advancedMode={false}
            simpleMode
            initiallyExpanded
            fieldErrors={fieldErrors}
            onChange={(updatedSection) => updateSection(section.id, updatedSection)}
            onRemove={() => undefined}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 w-full rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-6 [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t("level")}</p>

          <h3 className="mt-1 break-words text-lg font-bold">
            {selectedLevel?.name ?? t("configure")}
          </h3>

          {selectedLevel && (
            <p className="mt-1 text-sm text-muted">
              {levelT.has(`descriptions.${selectedLevel.key.toLowerCase()}`)
                ? levelT(`descriptions.${selectedLevel.key.toLowerCase()}`)
                : selectedLevel.description}
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
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
            {t("summary", {
              sections: variant.sections.length,
              movements: movementCount,
            })}
          </span>
        </div>
      )}

      {displayedIsExpanded && (
        <div id={contentId} className="min-w-0">
          <div className="mt-6 grid min-w-0 gap-5">
            {advancedMode ? (
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
              ) : (
                <div
                  id={`variant-level-${variant.id}`}
                  role="radiogroup"
                  aria-label={t("level")}
                  aria-describedby={
                    fieldErrors[`variant-level-${variant.id}`]
                      ? `variant-level-${variant.id}-error`
                      : `variant-level-${variant.id}-hint`
                  }
                  className="flex flex-wrap gap-2"
                >
                  {workoutLevels.map((level) => {
                    const isSelected = level.key === variant.levelKey;

                    return (
                      <button
                        key={level.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => update("levelKey", level.key)}
                        className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          isSelected
                            ? "border-accent bg-accent text-accent-foreground shadow-sm shadow-accent/25"
                            : "border-border bg-background text-foreground hover:border-accent/40"
                        }`}
                      >
                        {levelT.has(`names.${level.key.toLowerCase()}`)
                          ? levelT(`names.${level.key.toLowerCase()}`)
                          : level.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {!advancedMode ? (
                <p
                  id={`variant-level-${variant.id}-hint`}
                  className="mt-2 text-xs text-muted"
                >
                  {t("singleLevelHint")}
                </p>
              ) : null}
              {fieldErrors[`variant-level-${variant.id}`] ? (
                <p
                  id={`variant-level-${variant.id}-error`}
                  className="mt-1.5 text-sm text-red-500"
                >
                  {fieldErrors[`variant-level-${variant.id}`]}
                </p>
              ) : null}
            </div>

            {advancedMode ? (
              <details
                open={showOptionalDetails}
                onToggle={(event) =>
                  setShowOptionalDetails(event.currentTarget.open)
                }
                className="group rounded-xl border border-dashed border-border bg-background"
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
                <div className="grid gap-5 border-t border-border p-4">
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
              </details>
            ) : null}
          </div>

          <div className="my-6 border-t border-border" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="font-semibold">{t("sections")}</h4>

              <p className="mt-1 text-sm text-muted">
                {t("sectionsDescription")}
              </p>
            </div>

            {advancedMode ? (
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
            ) : null}
          </div>

          <div id={`variant-sections-${variant.id}`} tabIndex={-1} className="mt-5 min-w-0 space-y-2">
            {variant.sections.map((section) => {
              const format = workoutTypes.find((type) => type.key === section.typeKey);
              return (
                <div key={section.id} data-section-row={section.id} className={`flex items-center gap-2 rounded-xl border bg-background px-2 py-2.5 transition ${draggingSectionId === section.id ? "border-accent/60 opacity-70 shadow-lg" : "border-border"}`}>
                  <button type="button" aria-label={t("reorderSection")} title={t("reorderSection")}
                    onPointerDown={(event) => { event.preventDefault(); sectionPointerId.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); setDraggingSectionId(section.id); }}
                    onPointerMove={(event) => { if (!draggingSectionId || sectionPointerId.current !== event.pointerId) return; const target = document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>("[data-section-row]"); if (target?.dataset.sectionRow) reorderSection(draggingSectionId,target.dataset.sectionRow); }}
                    onPointerUp={(event) => { if (sectionPointerId.current === event.pointerId) { sectionPointerId.current=null; setDraggingSectionId(null); } }}
                    onPointerCancel={() => { sectionPointerId.current=null; setDraggingSectionId(null); }}
                    className="inline-flex h-11 w-9 shrink-0 touch-none cursor-grab select-none items-center justify-center rounded-lg text-xl tracking-[-0.18em] text-muted active:cursor-grabbing active:text-accent">⋮⋮</button>
                  <button type="button" onClick={() => editSection(section)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold">{t(`sectionRoles.${section.role.toLowerCase()}`)}</span>
                    <span className="block truncate text-xs text-muted">{[format?.name, section.rounds ? `${section.rounds} ${section.typeKey === "STRENGTH" ? "sets" : "rounds"}` : null, section.movements.length ? `${section.movements.length} movements` : null].filter(Boolean).join(" · ")}</span>
                  </button>
                  <button type="button" onClick={() => editSection(section)} aria-label={t("editSection")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground">✎</button>
                  <button type="button" onClick={() => removeSection(section.id)} disabled={variant.sections.length === 1} aria-label={t("remove")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"><TrashIcon /></button>
                </div>
              );
            })}
          </div>

          {editingSectionId && sectionDraft ? (
            <div className="fixed inset-0 z-[80] flex items-end overflow-hidden bg-black/60 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true">
              <div className="flex h-[min(94dvh,52rem)] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
                  <h3 className="text-lg font-bold">{isAddingSection ? t("addSection") : t("editSection")}</h3>
                  <button type="button" onClick={cancelSectionEditor} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl text-muted hover:bg-surface-elevated">×</button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-6">
                  <WorkoutSectionForm section={sectionDraft} sectionNumber={1} workoutTypes={workoutTypes} canRemove={false} prescriptionCategories={prescriptionCategories} fieldErrors={fieldErrors} advancedMode simpleMode initiallyExpanded onChange={setSectionDraft} onRemove={() => undefined} />
                </div>
                <div className="relative z-10 shrink-0 border-t border-border bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4">
                  <button type="button" disabled={!sectionDraft.typeKey || sectionDraft.movements.length === 0} onClick={confirmSectionEditor} className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40">
                    {isAddingSection ? t("addSection") : t("saveSection")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
