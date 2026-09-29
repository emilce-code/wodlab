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
import WorkoutTextImporter, {
  type WorkoutImportResult,
} from "./WorkoutTextImporter";

type Props = {
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
  prescriptionCategories: PrescriptionCategory[];
  initialWorkout?: EditableWorkout;
};

export type EditableWorkout = {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;
  type: { key: string };
  variants: Array<{
    id: string;
    name: string | null;
    notes: string | null;
    level: { key: string };
    sections: Array<{
      id: string;
      type: { key: string };
      role?: "WARM_UP" | "STRENGTH" | "WOD" | "ACCESSORY" | "COOLDOWN" | "CUSTOM";
      rounds: number | null;
      durationSeconds: number | null;
      restSeconds: number | null;
      repScheme: number[];
      notes: string | null;
      movements: Array<{
        id: string;
        movement: {
          id: string;
          name: string;
          measurementTypes: Array<{ key: string; name: string }>;
        };
        reps: number | null;
        weight: number | null;
        weightUnit: "KG" | "LB" | null;
        percentage: number | null;
        referenceRepMax: number | null;
        distance: number | null;
        calories: number | null;
        durationSeconds: number | null;
        notes: string | null;
        prescriptions: Array<{
          category: { key: string };
          reps: number | null;
          weight: number | null;
          weightUnit: "KG" | "LB" | null;
          percentage: number | null;
          referenceRepMax: number | null;
          distance: number | null;
          calories: number | null;
          durationSeconds: number | null;
          notes: string | null;
        }>;
      }>;
    }>;
  }>;
};

const formValue = (value: number | null) =>
  value === null ? "" : String(value);

function mapWorkoutToForm(workout: EditableWorkout): WorkoutVariantFormState[] {
  return workout.variants.map((variant) => ({
    id: variant.id,
    levelKey: variant.level.key,
    name: variant.name ?? "",
    notes: variant.notes ?? "",
    sections: variant.sections.map((section) => ({
      id: section.id,
      typeKey: section.type.key,
      role: section.role ?? "WOD",
      rounds: formValue(section.rounds),
      durationSeconds: formValue(section.durationSeconds),
      restSeconds: formValue(section.restSeconds),
      repScheme: section.repScheme.join("-"),
      notes: section.notes ?? "",
      movements: section.movements.map((item) => ({
        id: item.id,
        movementId: item.movement.id,
        movementName: item.movement.name,
        movementOption: {
          id: item.movement.id,
          name: item.movement.name,
          aliases: [],
          category: { key: "", name: "" },
          measurementTypes: item.movement.measurementTypes,
        },
        reps: formValue(item.reps),
        weight: formValue(item.weight),
        weightUnit: item.weightUnit ?? "",
        percentage: formValue(item.percentage),
        referenceRepMax: formValue(item.referenceRepMax) || "1",
        distance: formValue(item.distance),
        calories: formValue(item.calories),
        durationSeconds: formValue(item.durationSeconds),
        notes: item.notes ?? "",
        prescriptions: item.prescriptions.map((prescription) => ({
          categoryKey: prescription.category.key,
          reps: formValue(prescription.reps),
          weight: formValue(prescription.weight),
          weightUnit: prescription.weightUnit ?? "",
          percentage: formValue(prescription.percentage),
          referenceRepMax: formValue(prescription.referenceRepMax),
          distance: formValue(prescription.distance),
          calories: formValue(prescription.calories),
          durationSeconds: formValue(prescription.durationSeconds),
          notes: prescription.notes ?? "",
        })),
      })),
    })),
  }));
}

type FormStep = "start" | "details" | "programming" | "review";
type CreationMode = "simple" | "levels" | "import";

export type WorkoutFormFieldErrors = Record<string, string>;

type ValidationResult = {
  errors: WorkoutFormFieldErrors;
  firstFieldId: string | null;
  step: FormStep;
};

const formSteps: FormStep[] = ["start", "details", "programming", "review"];
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
    role: "WOD",
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
  initialWorkout,
}: Props) {
  const t = useTranslations("workouts.create");

  const typeT = useTranslations("workoutTypes");
  const levelT = useTranslations("workoutLevels");

  const router = useRouter();

  const storedDraft = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );

  const [isDraftPromptDismissed, setIsDraftPromptDismissed] = useState(false);

  const [currentStep, setCurrentStep] = useState<FormStep>(
    initialWorkout ? "details" : "start",
  );

  const [advancedMode, setAdvancedMode] = useState(Boolean(initialWorkout));
  const [creationMode, setCreationMode] = useState<CreationMode>(
    initialWorkout ? "levels" : "simple",
  );

  const isEditing = Boolean(initialWorkout);

  const [name, setName] = useState(initialWorkout?.name ?? "");

  const [description, setDescription] = useState(
    initialWorkout?.description ?? "",
  );

  const [typeKey, setTypeKey] = useState(initialWorkout?.type.key ?? "");

  const isBenchmark = initialWorkout?.isBenchmark ?? false;

  const [variants, setVariants] = useState<WorkoutVariantFormState[]>(() => {
    if (initialWorkout) {
      return mapWorkoutToForm(initialWorkout);
    }
    return [createEmptyVariant("")];
  });

  const [activeLevelKey, setActiveLevelKey] = useState<string>(initialWorkout?.variants[0]?.level.key ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<WorkoutFormFieldErrors>({});

  const hasUnsavedChanges = isEditing
    ? JSON.stringify({ name, description, typeKey, isBenchmark, variants }) !==
      JSON.stringify({
        name: initialWorkout?.name ?? "",
        description: initialWorkout?.description ?? "",
        typeKey: initialWorkout?.type.key ?? "",
        isBenchmark: initialWorkout?.isBenchmark ?? false,
        variants: initialWorkout ? mapWorkoutToForm(initialWorkout) : [],
      })
    : Boolean(name.trim()) ||
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
    if (isEditing || !hasUnsavedChanges || isSubmitting) {
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
    isEditing,
    name,
    typeKey,
    variants,
  ]);

  useEffect(() => {
    if (isEditing || !hasUnsavedChanges || isSubmitting) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isEditing, isSubmitting]);

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
      setVariants(draft.variants);
      setCurrentStep("start");
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

  function selectOrAddLevel(levelKey: string) {
    const existing = variants.find((variant) => variant.levelKey === levelKey);
    if (existing) {
      setActiveLevelKey(levelKey);
      return;
    }
    setVariants((current) => {
      if (current.length === 1 && !current[0].levelKey) {
        return [{ ...current[0], levelKey }];
      }
      return [...current, createEmptyVariant(levelKey)];
    });
    setActiveLevelKey(levelKey);
  }

  function copyLevel(source: WorkoutVariantFormState, targetId: string) {
    setVariants((current) => current.map((variant) => variant.id === targetId ? {
      ...variant,
      sections: source.sections.map((section) => ({
        ...section,
        id: crypto.randomUUID(),
        movements: section.movements.map((movement) => ({ ...movement, id: crypto.randomUUID(), prescriptions: movement.prescriptions.map((p) => ({ ...p })) })),
      })),
    } : variant));
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
    const primarySection = advancedMode
      ? updatedVariant.sections.find((section) => section.role === "WOD") ?? updatedVariant.sections[0]
      : updatedVariant.sections[0];
    if (primarySection?.typeKey) {
      setTypeKey(primarySection.typeKey);
    }
    setFieldErrors({});
    setError(null);
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? updatedVariant : variant)),
    );
  }

  function applyImport(result: WorkoutImportResult) {
    const defaultLevel =
      workoutLevels.find((level) => level.key === "RX") ?? workoutLevels[0];
    const importedVariants = result.draft.variants.length
      ? result.draft.variants
      : [
          {
            levelKey: defaultLevel?.key ?? "",
            name: null,
            notes: null,
            section: result.draft.section,
          },
        ];

    setName(result.draft.name);
    setDescription(result.draft.description ?? "");
    setTypeKey(result.draft.typeKey);
    setVariants(
      importedVariants.map((variant) => ({
        id: crypto.randomUUID(),
        levelKey: variant.levelKey,
        name: variant.name ?? "",
        notes: variant.notes ?? "",
        sections: [
          {
            id: crypto.randomUUID(),
            typeKey: variant.section.typeKey,
            rounds: formValue(variant.section.rounds),
            durationSeconds: formValue(variant.section.durationSeconds),
            restSeconds: formValue(variant.section.restSeconds),
            repScheme: variant.section.repScheme.join("-"),
            notes: variant.section.notes ?? "",
            movements: variant.section.movements.map((item) => ({
              id: crypto.randomUUID(),
              movementId: item.movement?.id ?? "",
              movementName: item.movement?.name ?? item.notes ?? "",
              movementOption: item.movement,
              reps: formValue(item.reps),
              weight: formValue(item.weight),
              weightUnit: item.weightUnit ?? "",
              percentage: "",
              referenceRepMax: "1",
              distance: formValue(item.distance),
              calories: formValue(item.calories),
              durationSeconds: formValue(item.durationSeconds),
              notes: item.matchStatus === "MATCHED" ? "" : item.source,
              prescriptions: item.prescriptions.map((prescription) => ({
                categoryKey: prescription.categoryKey,
                reps: formValue(prescription.reps),
                weight: formValue(prescription.weight),
                weightUnit: prescription.weightUnit ?? "",
                percentage: "",
                referenceRepMax: "",
                distance: formValue(prescription.distance),
                calories: formValue(prescription.calories),
                durationSeconds: formValue(prescription.durationSeconds),
                notes: prescription.notes ?? "",
              })),
            })),
          },
        ],
      })),
    );
    setError(null);
    setFieldErrors({});
    setCurrentStep("programming");
    setCreationMode(result.draft.variants.length > 1 ? "levels" : "simple");
    setAdvancedMode(result.draft.variants.length > 1);
  }

  function selectCreationMode(mode: CreationMode) {
    setCreationMode(mode);

    if (mode === "levels") {
      setAdvancedMode(true);
      setActiveLevelKey(variants.find((variant) => variant.levelKey)?.levelKey ?? "");
    }

    if (mode === "simple") {
      setAdvancedMode(false);
      setActiveLevelKey("");
    }
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
    if (currentStep === "start") {
      goToStep("details");
      return;
    }

    const validationResult =
      currentStep === "details" ? validateDetails() : validateProgramming();

    if (showValidation(validationResult)) {
      return;
    }

    const currentIndex = displayedFormSteps.indexOf(currentStep);
    const nextStep = displayedFormSteps[currentIndex + 1];

    if (nextStep) {
      goToStep(nextStep);
    }
  }

  function goToPreviousStep() {
    const currentIndex = displayedFormSteps.indexOf(currentStep);
    const previousStep = displayedFormSteps[currentIndex - 1];

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

        typeKey: advancedMode
          ? variants.flatMap((variant) => variant.sections).find((section) => section.role === "WOD" && section.typeKey)?.typeKey ?? variants.flatMap((variant) => variant.sections).find((section) => section.typeKey)?.typeKey ?? typeKey
          : typeKey,
        isBenchmark: isEditing ? isBenchmark : false,

        variants: variants.map((variant) => ({
          levelKey: variant.levelKey,

          name: variant.name.trim() || undefined,

          notes: variant.notes.trim() || undefined,

          sections: variant.sections.map((section, sectionIndex) => ({
            typeKey: section.typeKey,

            role: section.role,

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

              percentage: optionalNumber(movement.percentage),

              referenceRepMax: movement.percentage
                ? optionalNumber(movement.referenceRepMax)
                : undefined,

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

                  percentage: optionalNumber(prescription.percentage),

                  referenceRepMax: prescription.percentage
                    ? optionalNumber(prescription.referenceRepMax)
                    : undefined,

                  referenceMovementId: prescription.percentage
                    ? movement.movementId
                    : undefined,

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
                    prescription.percentage !== undefined ||
                    prescription.distance !== undefined ||
                    prescription.calories !== undefined ||
                    prescription.durationSeconds !== undefined ||
                    prescription.notes !== undefined,
                ),
            })),
          })),
        })),
      };

      const response = await fetch(
        initialWorkout ? `/api/workouts/${initialWorkout.id}` : "/api/workouts",
        {
          method: initialWorkout ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        setError(message ?? t("validation.createError"));

        return;
      }

      if (!isEditing) removeDraft();

      router.push(`/workouts/${initialWorkout?.id ?? data.id}`);

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

  const displayedFormSteps = isEditing
    ? formSteps.filter((step) => step !== "start")
    : formSteps;

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

  function getWorkoutTypeLabel(typeKeyValue: string) {
    const workoutType = workoutTypes.find((type) => type.key === typeKeyValue);

    return workoutType ? getWorkoutTypeName(workoutType) : typeKeyValue;
  }

  function getPrimaryScoreLabel() {
    const normalizedTypeKey = typeKey.toUpperCase();

    if (normalizedTypeKey === "FOR_TIME") {
      return t("scoreTypes.time");
    }

    if (normalizedTypeKey === "STRENGTH") {
      return t("scoreTypes.load");
    }

    if (normalizedTypeKey === "MAX_REPS") {
      return t("scoreTypes.reps");
    }

    return t("scoreTypes.roundsReps");
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

    if (movement.percentage && movement.referenceRepMax) {
      values.push(`${movement.percentage}% · ${movement.referenceRepMax}RM`);
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
      {!isEditing &&
      storedDraft &&
      !isDraftPromptDismissed &&
      !hasUnsavedChanges ? (
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
        <ol className="flex items-center">
          {displayedFormSteps.map((step, index) => {
            const currentStepIndex = displayedFormSteps.indexOf(currentStep);
            const isCurrent = step === currentStep;
            const isComplete = currentStepIndex > index;
            const isConnectorComplete = currentStepIndex > index;

            return (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    if (isComplete || isCurrent) {
                      goToStep(step);
                    }
                  }}
                  disabled={!isComplete && !isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-center text-sm font-bold transition ${
                    isCurrent
                      ? "border-accent bg-accent text-accent-foreground shadow-sm shadow-accent/25"
                      : isComplete
                        ? "border-accent bg-accent text-accent-foreground hover:border-accent/80"
                        : "cursor-not-allowed border-border bg-surface-elevated text-muted opacity-70"
                  }`}
                >
                  <span className="sr-only">{t(`steps.${step}.title`)}</span>
                  <span aria-hidden="true">{index + 1}</span>
                </button>
                {index < displayedFormSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`mx-2 h-0.5 flex-1 rounded-full transition ${
                      isConnectorComplete ? "bg-accent" : "bg-border"
                    }`}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {currentStep === "start" ? (
        <section className="space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t("start.eyebrow")}
            </p>

            <h2 className="mt-1 text-xl font-bold">{t("start.title")}</h2>

            <p className="mt-1 text-sm text-muted">
              {t("start.description")}
            </p>
          </div>

          {!isEditing ? (
            <div>
              <div className="mt-3 grid gap-3">
                {(["simple", "levels", "import"] as const).map((mode) => {
                  const isSelected = creationMode === mode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => selectCreationMode(mode)}
                      aria-pressed={isSelected}
                      className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-background hover:border-accent/40"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">
                          {t(`start.modes.${mode}.title`)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {t(`start.modes.${mode}.description`)}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {currentStep === "details" ? (
        <section className="space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {creationMode === "import" && !isEditing
                ? t("importer.title")
                : t("details.eyebrow")}
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {creationMode === "import" && !isEditing
                ? t("importer.title")
                : t("details.title")}
            </h2>

            <p className="mt-1 text-sm text-muted">
              {creationMode === "import" && !isEditing
                ? t("importer.description")
                : t("details.description")}
            </p>
          </div>

          {creationMode === "import" && !isEditing ? (
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              <WorkoutTextImporter onApply={applyImport} />
            </div>
          ) : (

<div className="grid gap-5">
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
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                {t("details.workoutDescription")} <span className="font-normal text-muted">({t("variants.optional")})</span>
              </label>
              <textarea id="description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("details.descriptionPlaceholder")} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10" />
            </div>
          </div>
          )}
        </section>
      ) : null}

      {currentStep === "programming" ? (
        <section className="min-w-0">
          {advancedMode ? (
            <div className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h2 className="text-lg font-bold">{t("levelsBuilder.title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("levelsBuilder.description")}</p>
              <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                {workoutLevels.map((level) => {
                  const configured = variants.some((variant) => variant.levelKey === level.key);
                  const active = activeLevelKey === level.key;
                  return (
                    <button key={level.key} type="button" onClick={() => selectOrAddLevel(level.key)}
                      className={`min-h-11 min-w-0 rounded-full border px-1.5 py-2 text-xs font-semibold transition min-[380px]:px-2 min-[380px]:text-sm sm:px-4 ${active ? "border-accent bg-accent text-accent-foreground" : configured ? "border-accent/50 bg-accent/10 text-foreground" : "border-border bg-background text-muted"}`}>
                      {configured ? "✓ " : ""}{levelT.has(`names.${level.key.toLowerCase()}`) ? levelT(`names.${level.key.toLowerCase()}`) : level.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {advancedMode && activeLevelKey ? (() => {
            const activeVariant = variants.find((variant) => variant.levelKey === activeLevelKey);
            const sources = variants.filter((variant) => variant.levelKey && variant.levelKey !== activeLevelKey && variant.sections.some((section) => section.movements.length > 0));
            const isEmpty = activeVariant && activeVariant.sections.every((section) => section.movements.length === 0 && !section.typeKey);
            return activeVariant && isEmpty && sources.length ? (
              <div className="mb-5 rounded-2xl border border-dashed border-border bg-surface p-5 text-center">
                <h3 className="font-bold">{t("levelsBuilder.emptyTitle", { level: workoutLevels.find((level) => level.key === activeLevelKey)?.name ?? activeLevelKey })}</h3>
                <p className="mt-1 text-sm text-muted">{t("levelsBuilder.emptyDescription")}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {sources.map((source) => <Button key={source.id} type="button" variant="secondary" onClick={() => copyLevel(source, activeVariant.id)}>{t("levelsBuilder.copyFrom", { level: workoutLevels.find((level) => level.key === source.levelKey)?.name ?? source.levelKey })}</Button>)}
                </div>
              </div>
            ) : null;
          })() : null}

          <div id="workout-variants" tabIndex={-1} className="min-w-0 space-y-5">
            {variants.map((variant, index) => (
              (!advancedMode || !activeLevelKey || variant.levelKey === activeLevelKey) ? <WorkoutVariantForm
                key={variant.id}
                variant={variant}
                workoutTypes={workoutTypes}
                workoutLevels={workoutLevels}
                usedLevelKeys={usedLevelKeys}
                canRemove={variants.length > 1}
                prescriptionCategories={prescriptionCategories}
                fieldErrors={fieldErrors}
                advancedMode={advancedMode}
                initiallyExpanded={
                  isEditing ||
                  (index === 0 &&
                    variant.sections.every(
                      (section) => section.movements.length === 0,
                    )) ||
                  Boolean(fieldErrors[`variant-level-${variant.id}`]) ||
                  Boolean(fieldErrors[`variant-sections-${variant.id}`])
                }
                expandSectionsByDefault={isEditing}
                onChange={(updatedVariant) =>
                  updateVariant(variant.id, updatedVariant)
                }
                onRemove={() => { removeVariant(variant.id); setActiveLevelKey(""); }}
              /> : null
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

          <div className="mt-6 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                {typeKey ? getWorkoutTypeLabel(typeKey) : t("review.workout")}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                {getPrimaryScoreLabel()}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                {t("review.countSummary", {
                  variants: variants.length,
                  sections: totalSections,
                  movements: totalMovements,
                })}
              </span>
            </div>

            <h3 className="mt-4 text-3xl font-black tracking-tight">
              {name || t("review.untitled")}
            </h3>
            {description ? (
              <p className="mt-2 text-sm text-muted">{description}</p>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {variants.map((variant, variantIndex) => (
              <article
                key={variant.id}
                className="rounded-2xl border border-border bg-background p-4"
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
                  {variant.sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {t(`sectionBuilder.roles.${section.role.toLowerCase()}`)}{" · "}
                        {getWorkoutTypeLabel(section.typeKey)}
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
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  {prescription.length > 0 ? (
                                    <span className="mr-2 text-accent">
                                      {prescription.join(" · ")}
                                    </span>
                                  ) : null}
                                  {movement.movementName}
                                </p>
                                <p className="text-xs text-muted">
                                  {prescription.length > 0
                                    ? null
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

      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
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
            {currentStep !== "start" ? (
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
                {isSubmitting
                  ? t(isEditing ? "saving" : "creating")
                  : t(isEditing ? "saveChanges" : "create")}
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
