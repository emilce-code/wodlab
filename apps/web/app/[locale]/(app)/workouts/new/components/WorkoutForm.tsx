"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

import type { PrescriptionCategory, WorkoutLevel, WorkoutType } from "../page";

import type { WorkoutSectionFormState } from "./WorkoutSectionForm";

import WorkoutVariantForm, {
  WorkoutVariantFormState,
} from "./WorkoutVariantForm";

type Props = {
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
  prescriptionCategories: PrescriptionCategory[];
};

type FormStep = "details" | "programming" | "review";

export type WorkoutFormFieldErrors = Record<string, string>;

type ValidationResult = {
  errors: WorkoutFormFieldErrors;
  firstFieldId: string | null;
  step: FormStep;
};

const formSteps: FormStep[] = ["details", "programming", "review"];
const WORKOUT_DRAFT_KEY = "wodlab.workout-draft.v1";
const WORKOUT_DRAFT_EVENT = "wodlab-workout-draft-change";

type WorkoutDraft = {
  version: 1;
  updatedAt: string;
  name: string;
  description: string;
  typeKey: string;
  isBenchmark: boolean;
  variants: WorkoutVariantFormState[];
};

function getDraftSnapshot() {
  return window.localStorage.getItem(WORKOUT_DRAFT_KEY);
}

function getServerDraftSnapshot() {
  return null;
}

function subscribeToDraft(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === WORKOUT_DRAFT_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(WORKOUT_DRAFT_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(WORKOUT_DRAFT_EVENT, onStoreChange);
  };
}

function saveDraft(draft: WorkoutDraft) {
  window.localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
  window.dispatchEvent(new Event(WORKOUT_DRAFT_EVENT));
}

function removeDraft() {
  window.localStorage.removeItem(WORKOUT_DRAFT_KEY);
  window.dispatchEvent(new Event(WORKOUT_DRAFT_EVENT));
}

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

function createEmptyVariant(levelKey = ""): WorkoutVariantFormState {
  return {
    id: crypto.randomUUID(),
    levelKey,
    name: "",
    notes: "",
    sections: [createEmptySection()],
  };
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  return Number(value);
}

function parseRepScheme(value: string): number[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split("-")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export default function WorkoutForm({
  workoutTypes,
  workoutLevels,
  prescriptionCategories,
}: Props) {
  const t = useTranslations("workouts.create");

  const typeT = useTranslations("workoutTypes");

  const router = useRouter();

  const storedDraft = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );

  const [isDraftPromptDismissed, setIsDraftPromptDismissed] = useState(false);

  const [currentStep, setCurrentStep] = useState<FormStep>("details");

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [typeKey, setTypeKey] = useState("");

  const [isBenchmark, setIsBenchmark] = useState(false);

  const [variants, setVariants] = useState<WorkoutVariantFormState[]>(() => {
    const defaultLevel =
      workoutLevels.find((level) => level.key === "RX") ?? workoutLevels[0];

    return [createEmptyVariant(defaultLevel?.key ?? "")];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<WorkoutFormFieldErrors>({});

  const hasUnsavedChanges =
    Boolean(name.trim()) ||
    Boolean(description.trim()) ||
    Boolean(typeKey) ||
    isBenchmark ||
    variants.length > 1 ||
    variants.some(
      (variant) =>
        Boolean(variant.name.trim()) ||
        Boolean(variant.notes.trim()) ||
        variant.sections.length > 1 ||
        variant.sections.some(
          (section) =>
            Boolean(section.typeKey) ||
            Boolean(section.rounds) ||
            Boolean(section.durationSeconds) ||
            Boolean(section.restSeconds) ||
            Boolean(section.repScheme.trim()) ||
            Boolean(section.notes.trim()) ||
            section.movements.length > 0,
        ),
    );

  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveDraft({
        version: 1,
        updatedAt: new Date().toISOString(),
        name,
        description,
        typeKey,
        isBenchmark,
        variants,
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [
    description,
    hasUnsavedChanges,
    isBenchmark,
    isSubmitting,
    name,
    typeKey,
    variants,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  function restoreDraft() {
    if (!storedDraft) {
      return;
    }

    try {
      const draft = JSON.parse(storedDraft) as WorkoutDraft;

      if (draft.version !== 1 || !Array.isArray(draft.variants)) {
        throw new Error("Unsupported workout draft");
      }

      setName(draft.name);
      setDescription(draft.description);
      setTypeKey(draft.typeKey);
      setIsBenchmark(draft.isBenchmark);
      setVariants(draft.variants);
      setCurrentStep("details");
      setError(null);
      setFieldErrors({});
      setIsDraftPromptDismissed(true);
    } catch {
      removeDraft();
      setIsDraftPromptDismissed(true);
    }
  }

  function discardDraft() {
    removeDraft();
    setIsDraftPromptDismissed(true);
  }

  function getWorkoutTypeName(type: WorkoutType) {
    const key = type.key.toLowerCase();

    return typeT.has(key) ? typeT(key) : type.name;
  }

  function addVariant() {
    const usedLevelKeys = variants
      .map((variant) => variant.levelKey)
      .filter(Boolean);

    const nextLevel = workoutLevels.find(
      (level) => !usedLevelKeys.includes(level.key),
    );

    setVariants((current) => [
      ...current,
      createEmptyVariant(nextLevel?.key ?? ""),
    ]);
  }

  function removeVariant(id: string) {
    setVariants((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((variant) => variant.id !== id);
    });
  }

  function updateVariant(id: string, updatedVariant: WorkoutVariantFormState) {
    setFieldErrors({});
    setError(null);
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? updatedVariant : variant)),
    );
  }

  function clearFieldError(fieldId: string) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    setError(null);
  }

  function validateDetails(): ValidationResult {
    const errors: WorkoutFormFieldErrors = {};

    if (!name.trim()) {
      errors.name = t("validation.nameRequired");
    }

    if (!typeKey) {
      errors.type = t("validation.typeRequired");
    }

    return {
      errors,
      firstFieldId: Object.keys(errors)[0] ?? null,
      step: "details",
    };
  }

  function validateProgramming(): ValidationResult {
    const errors: WorkoutFormFieldErrors = {};
    let firstFieldId: string | null = null;

    function addError(fieldId: string, message: string) {
      errors[fieldId] = message;
      firstFieldId ??= fieldId;
    }

    if (variants.length === 0) {
      return {
        errors: {
          "workout-variants": t("variants.validation.variantRequired"),
        },
        firstFieldId: "workout-variants",
        step: "programming",
      };
    }

    const usedLevels = new Set<string>();

    for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
      const variant = variants[variantIndex];

      if (!variant.levelKey) {
        addError(
          `variant-level-${variant.id}`,
          t("variants.validation.levelRequired", {
            variant: variantIndex + 1,
          }),
        );
      }

      if (variant.levelKey && usedLevels.has(variant.levelKey)) {
        addError(
          `variant-level-${variant.id}`,
          t("variants.validation.duplicateLevel"),
        );
      }

      if (variant.levelKey) {
        usedLevels.add(variant.levelKey);
      }

      if (variant.sections.length === 0) {
        addError(
          `variant-sections-${variant.id}`,
          t("validation.sectionRequired"),
        );
      }

      for (
        let sectionIndex = 0;
        sectionIndex < variant.sections.length;
        sectionIndex++
      ) {
        const section = variant.sections[sectionIndex];

        if (!section.typeKey) {
          addError(
            `section-type-${section.id}`,
            t("validation.sectionTypeRequired", {
              section: sectionIndex + 1,
            }),
          );
        }

        if (section.movements.length === 0) {
          addError(
            `section-movements-${section.id}`,
            t("validation.movementRequired", {
              section: sectionIndex + 1,
            }),
          );
        }

        for (
          let movementIndex = 0;
          movementIndex < section.movements.length;
          movementIndex++
        ) {
          const movement = section.movements[movementIndex];

          if (!movement.movementId) {
            addError(
              `movement-search-${movement.id}`,
              t("validation.movementSelectionRequired", {
                section: sectionIndex + 1,
                movement: movementIndex + 1,
              }),
            );
          }
        }

        if (section.repScheme.trim()) {
          const parts = section.repScheme.split("-").map((part) => part.trim());

          const valid = parts.every((part) => {
            if (!part) {
              return false;
            }

            const value = Number(part);

            return Number.isInteger(value) && value > 0;
          });

          if (!valid) {
            addError(
              `section-rep-scheme-${section.id}`,
              t("validation.invalidRepScheme", {
                section: sectionIndex + 1,
              }),
            );
          }
        }
      }
    }

    return { errors, firstFieldId, step: "programming" };
  }

  function validateForm(): ValidationResult {
    const detailsResult = validateDetails();

    if (detailsResult.firstFieldId) {
      return detailsResult;
    }

    return validateProgramming();
  }

  function focusInvalidField(fieldId: string) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const field = document.getElementById(fieldId);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      });
    });
  }

  function showValidation(result: ValidationResult) {
    setFieldErrors(result.errors);

    if (!result.firstFieldId) {
      setError(null);
      return false;
    }

    setError(result.errors[result.firstFieldId]);
    setCurrentStep(result.step);
    focusInvalidField(result.firstFieldId);
    return true;
  }

  function goToStep(step: FormStep) {
    setError(null);
    setFieldErrors({});
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNextStep() {
    const validationResult =
      currentStep === "details" ? validateDetails() : validateProgramming();

    if (showValidation(validationResult)) {
      return;
    }

    const currentIndex = formSteps.indexOf(currentStep);
    const nextStep = formSteps[currentIndex + 1];

    if (nextStep) {
      goToStep(nextStep);
    }
  }

  function goToPreviousStep() {
    const currentIndex = formSteps.indexOf(currentStep);
    const previousStep = formSteps[currentIndex - 1];

    if (previousStep) {
      goToStep(previousStep);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep !== "review") {
      goToNextStep();
      return;
    }

    setError(null);

    const validationResult = validateForm();

    if (showValidation(validationResult)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),

        description: description.trim() || undefined,

        typeKey,
        isBenchmark,

        variants: variants.map((variant) => ({
          levelKey: variant.levelKey,

          name: variant.name.trim() || undefined,

          notes: variant.notes.trim() || undefined,

          sections: variant.sections.map((section, sectionIndex) => ({
            typeKey: section.typeKey,

            order: sectionIndex + 1,

            rounds: optionalNumber(section.rounds),

            durationSeconds: optionalNumber(section.durationSeconds),

            restSeconds: optionalNumber(section.restSeconds),

            repScheme: parseRepScheme(section.repScheme),

            notes: section.notes.trim() || undefined,

            movements: section.movements.map((movement, movementIndex) => ({
              movementId: movement.movementId,

              order: movementIndex + 1,

              reps: optionalNumber(movement.reps),

              weight: optionalNumber(movement.weight),

              weightUnit: movement.weightUnit || undefined,

              distance: optionalNumber(movement.distance),

              calories: optionalNumber(movement.calories),

              durationSeconds: optionalNumber(movement.durationSeconds),

              notes: movement.notes.trim() || undefined,

              prescriptions: movement.prescriptions
                .map((prescription) => ({
                  categoryKey: prescription.categoryKey,

                  reps: optionalNumber(prescription.reps),

                  weight: optionalNumber(prescription.weight),

                  weightUnit: prescription.weightUnit || undefined,

                  distance: optionalNumber(prescription.distance),

                  calories: optionalNumber(prescription.calories),

                  durationSeconds: optionalNumber(prescription.durationSeconds),

                  notes: prescription.notes.trim() || undefined,
                }))
                .filter(
                  (prescription) =>
                    prescription.reps !== undefined ||
                    prescription.weight !== undefined ||
                    prescription.weightUnit !== undefined ||
                    prescription.distance !== undefined ||
                    prescription.calories !== undefined ||
                    prescription.durationSeconds !== undefined ||
                    prescription.notes !== undefined,
                ),
            })),
          })),
        })),
      };

      const response = await fetch("/api/workouts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        setError(message ?? t("validation.createError"));

        return;
      }

      removeDraft();

      router.push(`/workouts/${data.id}`);

      router.refresh();
    } catch {
      setError(t("validation.createError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const usedLevelKeys = variants
    .map((variant) => variant.levelKey)
    .filter(Boolean);

  const canAddVariant =
    workoutLevels.length === 0 || usedLevelKeys.length < workoutLevels.length;

  const totalSections = variants.reduce(
    (total, variant) => total + variant.sections.length,
    0,
  );

  const totalMovements = variants.reduce(
    (total, variant) =>
      total +
      variant.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.movements.length,
        0,
      ),
    0,
  );

  function formatSectionConfiguration(section: WorkoutSectionFormState) {
    const values: string[] = [];

    if (section.rounds) {
      values.push(`${section.rounds} ${t("sectionBuilder.rounds")}`);
    }

    if (section.durationSeconds) {
      values.push(
        `${Number(section.durationSeconds) / 60} ${t("sectionBuilder.minutes")}`,
      );
    }

    if (section.restSeconds) {
      values.push(
        `${section.restSeconds} ${t("sectionBuilder.seconds")} ${t("sectionBuilder.rest")}`,
      );
    }

    if (section.repScheme) {
      values.push(section.repScheme);
    }

    return values;
  }

  function formatMovementPrescription(
    movement: WorkoutSectionFormState["movements"][number],
  ) {
    const values: string[] = [];

    if (movement.reps) {
      values.push(`${movement.reps} ${t("movementBuilder.reps")}`);
    }

    if (movement.weight) {
      values.push(`${movement.weight} ${movement.weightUnit}`.trim());
    }

    if (movement.distance) {
      values.push(`${movement.distance} m`);
    }

    if (movement.calories) {
      values.push(`${movement.calories} cal`);
    }

    if (movement.durationSeconds) {
      values.push(
        `${movement.durationSeconds} ${t("movementBuilder.secondsShort")}`,
      );
    }

    return values;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {storedDraft && !isDraftPromptDismissed && !hasUnsavedChanges ? (
        <section
          aria-labelledby="workout-draft-title"
          className="rounded-xl border border-accent/30 bg-accent/10 p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="workout-draft-title" className="font-semibold">
                {t("draft.title")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t("draft.description")}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={discardDraft}
                variant="secondary"
                className="flex-1 bg-background sm:flex-none"
              >
                {t("draft.discard")}
              </Button>
              <Button
                type="button"
                onClick={restoreDraft}
                className="flex-1 sm:flex-none"
              >
                {t("draft.restore")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <nav aria-label={t("steps.ariaLabel")}>
        <ol className="grid gap-3 sm:grid-cols-3">
          {formSteps.map((step, index) => {
            const isCurrent = step === currentStep;
            const isComplete = formSteps.indexOf(currentStep) > index;

            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => {
                    if (isComplete || isCurrent) {
                      goToStep(step);
                    }
                  }}
                  disabled={!isComplete && !isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isCurrent
                      ? "border-accent bg-accent/10"
                      : isComplete
                        ? "border-border bg-surface hover:border-accent/40"
                        : "cursor-not-allowed border-border bg-surface opacity-55"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isCurrent || isComplete
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {isComplete ? "✓" : index + 1}
                  </span>

                  <span>
                    <span className="block text-sm font-semibold">
                      {t(`steps.${step}.title`)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {t(`steps.${step}.description`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {currentStep === "details" ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t("details.eyebrow")}
            </p>

            <h2 className="mt-1 text-xl font-bold">{t("details.title")}</h2>

            <p className="mt-1 text-sm text-muted">
              {t("details.description")}
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium"
              >
                {t("details.name")}
              </label>

              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFieldError("name");
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                placeholder={t("details.namePlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
              />
              {fieldErrors.name ? (
                <p id="name-error" className="mt-1.5 text-sm text-red-500">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium"
              >
                {t("details.workoutDescription")}

                <span className="ml-1 font-normal text-muted">
                  {t("optional")}
                </span>
              </label>

              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("details.descriptionPlaceholder")}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-1.5 block text-sm font-medium"
              >
                {t("details.type")}
              </label>

              <select
                id="type"
                required
                value={typeKey}
                onChange={(event) => {
                  setTypeKey(event.target.value);
                  clearFieldError("type");
                }}
                aria-invalid={Boolean(fieldErrors.type)}
                aria-describedby={fieldErrors.type ? "type-error" : undefined}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/10"
              >
                <option value="">{t("details.selectType")}</option>

                {workoutTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {getWorkoutTypeName(type)}
                  </option>
                ))}
              </select>
              {fieldErrors.type ? (
                <p id="type-error" className="mt-1.5 text-sm text-red-500">
                  {fieldErrors.type}
                </p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
              <input
                type="checkbox"
                checked={isBenchmark}
                onChange={(event) => setIsBenchmark(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--accent)]"
              />

              <div>
                <p className="text-sm font-medium">{t("details.benchmark")}</p>

                <p className="mt-0.5 text-xs text-muted">
                  {t("details.benchmarkDescription")}
                </p>
              </div>
            </label>
          </div>
        </section>
      ) : null}

      {currentStep === "programming" ? (
        <section className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("variants.eyebrow")}
              </p>

              <h2 className="mt-1 text-xl font-bold">{t("variants.title")}</h2>

              <p className="mt-1 text-sm text-muted">
                {t("variants.description")}
              </p>
            </div>

            <Button
              type="button"
              onClick={addVariant}
              disabled={!canAddVariant}
              variant="secondary"
            >
              + {t("variants.add")}
            </Button>
          </div>

          <div
            id="workout-variants"
            tabIndex={-1}
            className="mt-5 min-w-0 space-y-5"
          >
            {variants.map((variant, index) => (
              <WorkoutVariantForm
                key={variant.id}
                variant={variant}
                variantNumber={index + 1}
                workoutTypes={workoutTypes}
                workoutLevels={workoutLevels}
                usedLevelKeys={usedLevelKeys}
                canRemove={variants.length > 1}
                prescriptionCategories={prescriptionCategories}
                fieldErrors={fieldErrors}
                onChange={(updatedVariant) =>
                  updateVariant(variant.id, updatedVariant)
                }
                onRemove={() => removeVariant(variant.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {currentStep === "review" ? (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("review.eyebrow")}
              </p>

              <h2 className="mt-1 text-xl font-bold">{t("review.title")}</h2>

              <p className="mt-1 text-sm text-muted">
                {t("review.description")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => goToStep("details")}
              className="text-sm font-semibold text-accent hover:text-accent-strong"
            >
              {t("review.editDetails")}
            </button>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {t("review.workout")}
              </dt>
              <dd className="mt-2 font-semibold">{name}</dd>
              <dd className="mt-1 text-sm text-muted">
                {workoutTypes.find((type) => type.key === typeKey)
                  ? getWorkoutTypeName(
                      workoutTypes.find((type) => type.key === typeKey)!,
                    )
                  : typeKey}
              </dd>
              {description ? (
                <dd className="mt-2 line-clamp-2 text-xs text-muted">
                  {description}
                </dd>
              ) : null}
              {isBenchmark ? (
                <dd className="mt-2 inline-flex rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                  {t("details.benchmark")}
                </dd>
              ) : null}
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {t("review.sections")}
              </dt>
              <dd className="mt-2 text-2xl font-bold">{totalSections}</dd>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {t("review.variants")}
              </dt>
              <dd className="mt-2 text-2xl font-bold">{variants.length}</dd>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {t("review.movements")}
              </dt>
              <dd className="mt-2 text-2xl font-bold">{totalMovements}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-4">
            {variants.map((variant, variantIndex) => (
              <article
                key={variant.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {workoutLevels.find(
                        (level) => level.key === variant.levelKey,
                      )?.name ?? t("variants.configure")}
                    </p>
                    {variant.name ? (
                      <p className="mt-1 text-sm font-medium">{variant.name}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">
                      {t("review.sectionCount", {
                        count: variant.sections.length,
                      })}
                    </p>
                    {variant.notes ? (
                      <p className="mt-2 text-xs text-muted">{variant.notes}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep("programming")}
                    className="text-sm font-semibold text-accent hover:text-accent-strong"
                  >
                    {t("review.edit")}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {variant.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-sm font-medium">
                        {t("review.section", {
                          number: sectionIndex + 1,
                        })}{" "}
                        ·{" "}
                        {workoutTypes.find(
                          (type) => type.key === section.typeKey,
                        )?.name ?? section.typeKey}
                      </p>
                      {formatSectionConfiguration(section).length > 0 ? (
                        <p className="mt-1 text-xs text-muted">
                          {formatSectionConfiguration(section).join(" · ")}
                        </p>
                      ) : null}

                      <ul className="mt-3 space-y-2">
                        {section.movements.map((movement) => {
                          const prescription =
                            formatMovementPrescription(movement);

                          return (
                            <li
                              key={movement.id}
                              className="rounded-lg bg-surface px-3 py-2.5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  {movement.movementName}
                                </p>
                                <p className="text-xs text-muted">
                                  {prescription.length > 0
                                    ? prescription.join(" · ")
                                    : t("review.noPrescription")}
                                </p>
                              </div>

                              {movement.prescriptions.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="text-xs text-muted">
                                    {t("review.categoryOverrides")}:
                                  </span>
                                  {movement.prescriptions.map(
                                    (categoryPrescription) => (
                                      <span
                                        key={categoryPrescription.categoryKey}
                                        className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium"
                                      >
                                        {prescriptionCategories.find(
                                          (category) =>
                                            category.key ===
                                            categoryPrescription.categoryKey,
                                        )?.name ??
                                          categoryPrescription.categoryKey}
                                      </span>
                                    ),
                                  )}
                                </div>
                              ) : null}

                              {movement.notes ? (
                                <p className="mt-2 text-xs text-muted">
                                  {movement.notes}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>

                      {section.notes ? (
                        <p className="mt-3 text-xs text-muted">
                          {section.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <span className="sr-only">
                  {t("variants.variant", { number: variantIndex + 1 })}
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="sticky bottom-20 z-20 rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" aria-atomic="true">
            {error ? (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            ) : (
              <p className="text-sm text-muted">{t("reviewBeforeSaving")}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {currentStep !== "details" ? (
              <Button
                type="button"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                variant="secondary"
                className="px-5"
              >
                {t("steps.back")}
              </Button>
            ) : null}

            {currentStep === "review" ? (
              <Button
                key="create-workout"
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="px-5"
              >
                {isSubmitting ? t("creating") : t("create")}
              </Button>
            ) : (
              <Button
                key="continue-workout-form"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  goToNextStep();
                }}
                className="px-5"
              >
                {t("steps.continue")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
