"use client";

import { FormEvent, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import NumberField from "@/components/results/ResultNumberField";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { formatCalendarDate, formatClockTime } from "@/lib/date-formatters";
import type {
  MeasurementType,
  PrescriptionCategory,
  ResultType,
  WeightUnit,
  WorkoutResultForEdit,
} from "@/lib/result-types";
import { selectWorkoutVariant } from "@/lib/workout-variants";

export type {
  PrescriptionCategory,
  ResultType,
  WeightUnit,
  WorkoutResultForEdit,
} from "@/lib/result-types";

export type WorkoutMovement = {
  id: string;
  movement: {
    id: string;
    name: string;
    measurementTypes: MeasurementType[];
  };
};

export type WorkoutSection = {
  id: string;
  order: number;
  movements: WorkoutMovement[];
};

export type WorkoutVariant = {
  id: string;
  name: string | null;
  level: {
    key: string;
    name: string;
  };
  sections: WorkoutSection[];
};

type MovementPerformance = {
  reps: string;
  load: string;
  weightUnit: WeightUnit;
  distance: string;
  durationMinutes: string;
  durationSeconds: string;
  calories: string;
};

type MovementPerformanceState = Record<string, MovementPerformance>;

type ScoreField = "minutes" | "seconds" | "rounds" | "reps" | "load";

type ValidationIssue = {
  message: string;
  field?: ScoreField;
  section?: "movements" | "details";
};

type SubmittedMovement = {
  workoutMovementId: string;
  reps?: number;
  load?: number;
  weightUnit?: WeightUnit;
  distance?: number;
  durationSeconds?: number;
  calories?: number;
};

type Props = {
  workoutId: string;
  scheduledWorkoutId?: string;
  resultType: ResultType;
  variants: WorkoutVariant[];
  prescriptionCategories: PrescriptionCategory[];
  preferredWeightUnit?: WeightUnit;
  preferredWorkoutLevelKey?: string | null;
  preferredPrescriptionCategoryKey?: string | null;
  result?: WorkoutResultForEdit;
  onCancel?: () => void;
  onSaved?: () => void;
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildMovementPerformanceState(
  result: WorkoutResultForEdit | undefined,
  preferredWeightUnit: WeightUnit,
): MovementPerformanceState {
  if (!result) {
    return {};
  }

  return Object.fromEntries(
    result.performedMovements.map((movement) => {
      const totalDurationSeconds = movement.durationSeconds ?? 0;

      return [
        movement.workoutMovementId,
        {
          reps: movement.reps !== null ? String(movement.reps) : "",
          load: movement.load !== null ? String(movement.load) : "",
          weightUnit: movement.weightUnit ?? preferredWeightUnit,
          distance: movement.distance !== null ? String(movement.distance) : "",
          durationMinutes:
            movement.durationSeconds !== null
              ? String(Math.floor(totalDurationSeconds / 60))
              : "",
          durationSeconds:
            movement.durationSeconds !== null
              ? String(totalDurationSeconds % 60)
              : "",
          calories: movement.calories !== null ? String(movement.calories) : "",
        } satisfies MovementPerformance,
      ];
    }),
  );
}

export default function LogResultForm({
  workoutId,
  scheduledWorkoutId,
  resultType,
  variants,
  prescriptionCategories,
  preferredWeightUnit = "KG",
  preferredWorkoutLevelKey = null,
  preferredPrescriptionCategoryKey = null,
  result,
  onCancel,
  onSaved,
}: Props) {
  const t = useTranslations("workouts.logResult");
  const resultTypeT = useTranslations("resultTypes");
  const movementBuilderT = useTranslations("workouts.create.movementBuilder");

  const locale = useLocale();
  const router = useRouter();

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(result);
  const resultDate = result ? new Date(result.performedAt) : null;

  const defaultVariant = selectWorkoutVariant(variants, {
    preferredLevelKey: preferredWorkoutLevelKey,
  });

  const defaultPrescriptionCategoryKey =
    preferredPrescriptionCategoryKey &&
    prescriptionCategories.some(
      (category) => category.key === preferredPrescriptionCategoryKey,
    )
      ? preferredPrescriptionCategoryKey
      : "";

  const initialTimeSeconds = result?.timeSeconds ?? 0;

  const workoutVariantId = result?.workoutVariant?.id ?? defaultVariant?.id ?? "";

  const [prescriptionCategoryKey, setPrescriptionCategoryKey] = useState(
    result?.prescriptionCategory?.key ?? defaultPrescriptionCategoryKey,
  );

  const [minutes, setMinutes] = useState(
    result?.timeSeconds !== null && result?.timeSeconds !== undefined
      ? String(Math.floor(initialTimeSeconds / 60))
      : "",
  );

  const [seconds, setSeconds] = useState(
    result?.timeSeconds !== null && result?.timeSeconds !== undefined
      ? String(initialTimeSeconds % 60)
      : "",
  );

  const [rounds, setRounds] = useState(
    result?.rounds !== null && result?.rounds !== undefined
      ? String(result.rounds)
      : "",
  );

  const [reps, setReps] = useState(
    result?.reps !== null && result?.reps !== undefined
      ? String(result.reps)
      : "",
  );

  const [load, setLoad] = useState(
    result?.load !== null && result?.load !== undefined
      ? String(result.load)
      : "",
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    result?.weightUnit ?? preferredWeightUnit,
  );

  const [movementPerformances, setMovementPerformances] =
    useState<MovementPerformanceState>(() =>
      buildMovementPerformanceState(result, preferredWeightUnit),
    );

  const [performedDate, setPerformedDate] = useState(
    resultDate ? getLocalDateValue(resultDate) : getLocalDateValue(),
  );

  const [performedTime, setPerformedTime] = useState(
    resultDate ? getLocalTimeValue(resultDate) : getLocalTimeValue(),
  );

  const [notes, setNotes] = useState(result?.notes ?? "");
  const [movementDetailsOpen, setMovementDetailsOpen] = useState(
    Boolean(result?.performedMovements.length),
  );
  const [resultDetailsOpen, setResultDetailsOpen] = useState(
    isEditing || Boolean(result?.notes),
  );
  const [error, setError] = useState<string | null>(null);
  const [scoreErrors, setScoreErrors] = useState<
    Partial<Record<ScoreField, string>>
  >({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resultTypeKey = resultType.key.toLowerCase();
  const localizedResultType = resultTypeT.has(resultTypeKey)
    ? resultTypeT(resultTypeKey)
    : resultType.name;

  const selectedVariant =
    variants.find((variant) => variant.id === workoutVariantId) ?? null;

  const trackableMovements = selectedVariant
    ? selectedVariant.sections.flatMap((section) =>
        section.movements.filter((item) =>
          item.movement.measurementTypes.some((measurementType) =>
            ["WEIGHT", "REPS", "DISTANCE", "DURATION", "CALORIES"].includes(
              measurementType.key,
            ),
          ),
        ),
      )
    : [];

  function optionalNumber(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function getMeasurementKeys(item: WorkoutMovement) {
    return new Set(item.movement.measurementTypes.map((type) => type.key));
  }

  function getMovementPerformance(
    workoutMovementId: string,
  ): MovementPerformance {
    return (
      movementPerformances[workoutMovementId] ?? {
        reps: "",
        load: "",
        weightUnit: preferredWeightUnit,
        distance: "",
        durationMinutes: "",
        durationSeconds: "",
        calories: "",
      }
    );
  }

  function updateMovementPerformance(
    workoutMovementId: string,
    changes: Partial<MovementPerformance>,
  ) {
    setMovementPerformances((current) => ({
      ...current,
      [workoutMovementId]: {
        ...getMovementPerformance(workoutMovementId),
        ...changes,
      },
    }));
  }

  function updateScoreField(
    field: ScoreField,
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setScoreErrors((current) => ({ ...current, [field]: undefined }));
  }

  function getMovementDurationSeconds(performance: MovementPerformance) {
    const durationMinutes = optionalNumber(performance.durationMinutes) ?? 0;
    const durationSeconds = optionalNumber(performance.durationSeconds) ?? 0;

    if (durationMinutes === 0 && durationSeconds === 0) {
      return undefined;
    }

    return durationMinutes * 60 + durationSeconds;
  }

  function hasAnyMovementValue(performance: MovementPerformance) {
    return Boolean(
      performance.reps.trim() ||
      performance.load.trim() ||
      performance.distance.trim() ||
      performance.durationMinutes.trim() ||
      performance.durationSeconds.trim() ||
      performance.calories.trim(),
    );
  }

  function getSubmittedMovements(): SubmittedMovement[] {
    return trackableMovements.flatMap((item) => {
      const performance = getMovementPerformance(item.id);
      const measurementKeys = getMeasurementKeys(item);

      if (!hasAnyMovementValue(performance)) {
        return [];
      }

      const submitted: SubmittedMovement = {
        workoutMovementId: item.id,
      };

      const repsValue = optionalNumber(performance.reps);
      const loadValue = optionalNumber(performance.load);
      const distanceValue = optionalNumber(performance.distance);
      const durationValue = getMovementDurationSeconds(performance);
      const caloriesValue = optionalNumber(performance.calories);

      if (
        repsValue !== undefined &&
        (measurementKeys.has("REPS") || measurementKeys.has("WEIGHT"))
      ) {
        submitted.reps = repsValue;
      }

      if (loadValue !== undefined && measurementKeys.has("WEIGHT")) {
        submitted.load = loadValue;
        submitted.weightUnit = performance.weightUnit;
      }

      if (distanceValue !== undefined && measurementKeys.has("DISTANCE")) {
        submitted.distance = distanceValue;
      }

      if (durationValue !== undefined && measurementKeys.has("DURATION")) {
        submitted.durationSeconds = durationValue;
      }

      if (caloriesValue !== undefined && measurementKeys.has("CALORIES")) {
        submitted.calories = caloriesValue;
      }

      const hasSubmittedMetric =
        submitted.reps !== undefined ||
        submitted.load !== undefined ||
        submitted.distance !== undefined ||
        submitted.durationSeconds !== undefined ||
        submitted.calories !== undefined;

      return hasSubmittedMetric ? [submitted] : [];
    });
  }

  function formatSelectedDate(value: string) {
    if (!value) {
      return t("selectDate");
    }

    return formatCalendarDate(value, locale);
  }

  function formatSelectedTime(value: string) {
    if (!value) {
      return t("selectTime");
    }

    return formatClockTime(value, locale);
  }

  function validatePositiveValue(value: string) {
    if (!value.trim()) {
      return true;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue > 0;
  }

  function validateNonNegativeValue(value: string) {
    if (!value.trim()) {
      return true;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue >= 0;
  }

  function validateMovementPerformance(item: WorkoutMovement) {
    const performance = getMovementPerformance(item.id);
    const measurementKeys = getMeasurementKeys(item);

    if (!hasAnyMovementValue(performance)) {
      return null;
    }

    const hasReps = Boolean(performance.reps.trim());
    const hasLoad = Boolean(performance.load.trim());

    if (hasReps && !validatePositiveValue(performance.reps)) {
      return `${item.movement.name}: ${t("validation.repsRequired")}`;
    }

    if (hasLoad && !validatePositiveValue(performance.load)) {
      return `${item.movement.name}: ${t("validation.loadRequired")}`;
    }

    if (hasLoad && measurementKeys.has("WEIGHT") && !hasReps) {
      return `${item.movement.name}: ${t("validation.repsRequired")}`;
    }

    if (
      performance.distance.trim() &&
      !validatePositiveValue(performance.distance)
    ) {
      return `${item.movement.name}: distance must be greater than 0`;
    }

    if (
      performance.calories.trim() &&
      !validatePositiveValue(performance.calories)
    ) {
      return `${item.movement.name}: calories must be greater than 0`;
    }

    if (
      !validateNonNegativeValue(performance.durationMinutes) ||
      !validateNonNegativeValue(performance.durationSeconds)
    ) {
      return `${item.movement.name}: duration cannot be negative`;
    }

    const durationSeconds = optionalNumber(performance.durationSeconds) ?? 0;

    if (durationSeconds > 59) {
      return `${item.movement.name}: ${t("validation.invalidSeconds")}`;
    }

    const hasDuration =
      performance.durationMinutes.trim() || performance.durationSeconds.trim();

    if (hasDuration && getMovementDurationSeconds(performance) === undefined) {
      return `${item.movement.name}: duration must be greater than 0`;
    }

    return null;
  }

  function validate(): ValidationIssue | null {
    if (!workoutVariantId) {
      return { message: t("validation.variantRequired") };
    }

    switch (resultType.key) {
      case "TIME": {
        const minuteValue = optionalNumber(minutes) ?? 0;
        const secondValue = optionalNumber(seconds) ?? 0;

        if (minuteValue === 0 && secondValue === 0) {
          return { message: t("validation.timeRequired"), field: "minutes" };
        }

        if (minuteValue < 0) {
          return { message: t("validation.timeRequired"), field: "minutes" };
        }

        if (secondValue < 0 || secondValue > 59) {
          return {
            message: t("validation.invalidSeconds"),
            field: "seconds",
          };
        }

        break;
      }

      case "ROUNDS_REPS":
        if (!rounds.trim() && !reps.trim()) {
          return {
            message: t("validation.roundsOrRepsRequired"),
            field: "rounds",
          };
        }
        if (!validateNonNegativeValue(rounds)) {
          return {
            message: t("validation.roundsOrRepsRequired"),
            field: "rounds",
          };
        }
        if (!validateNonNegativeValue(reps)) {
          return {
            message: t("validation.roundsOrRepsRequired"),
            field: "reps",
          };
        }
        break;

      case "REPS":
        if (!reps.trim() || !validatePositiveValue(reps)) {
          return { message: t("validation.repsRequired"), field: "reps" };
        }
        break;

      case "LOAD":
        if (!load.trim() || !validatePositiveValue(load)) {
          return { message: t("validation.loadRequired"), field: "load" };
        }
        break;
    }

    for (const item of trackableMovements) {
      const movementError = validateMovementPerformance(item);

      if (movementError) {
        return { message: movementError, section: "movements" };
      }
    }

    if (!performedDate || !performedTime) {
      return {
        message: t("validation.performedAtRequired"),
        section: "details",
      };
    }

    return null;
  }

  function getPerformedAtIso() {
    return new Date(`${performedDate}T${performedTime}`).toISOString();
  }

  function openDatePicker() {
    dateInputRef.current?.showPicker();
  }

  function openTimePicker() {
    timeInputRef.current?.showPicker();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setScoreErrors({});
    setSuccess(false);

    const validationError = validate();

    if (validationError) {
      setError(validationError.message);

      if (validationError.field) {
        setScoreErrors({ [validationError.field]: validationError.message });
      }

      if (validationError.section === "movements") {
        setMovementDetailsOpen(true);
      }

      if (validationError.section === "details") {
        setResultDetailsOpen(true);
      }

      requestAnimationFrame(() => {
        const fieldId = validationError.field
          ? isEditing
            ? `edit${validationError.field[0].toUpperCase()}${validationError.field.slice(1)}`
            : validationError.field
          : null;
        const sectionId =
          validationError.section === "movements"
            ? "workout-movement-results"
            : "workout-result-details";

        document.getElementById(fieldId ?? sectionId)?.focus();
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        workoutVariantId: string;
        scheduledWorkoutId?: string;
        prescriptionCategoryKey?: string;
        performedAt: string;
        timeSeconds?: number;
        rounds?: number;
        reps?: number;
        load?: number;
        weightUnit?: WeightUnit;
        notes?: string;
        movements?: SubmittedMovement[];
      } = {
        workoutVariantId,
        performedAt: getPerformedAtIso(),
      };

      if (!isEditing && scheduledWorkoutId) {
        payload.scheduledWorkoutId = scheduledWorkoutId;
      }

      if (isEditing) {
        payload.prescriptionCategoryKey = prescriptionCategoryKey;
        payload.notes = notes.trim();
      } else {
        if (prescriptionCategoryKey) {
          payload.prescriptionCategoryKey = prescriptionCategoryKey;
        }

        if (notes.trim()) {
          payload.notes = notes.trim();
        }
      }

      switch (resultType.key) {
        case "TIME":
          payload.timeSeconds =
            (optionalNumber(minutes) ?? 0) * 60 +
            (optionalNumber(seconds) ?? 0);
          break;

        case "ROUNDS_REPS":
          payload.rounds = optionalNumber(rounds);
          payload.reps = optionalNumber(reps);
          break;

        case "REPS":
          payload.reps = optionalNumber(reps);
          break;

        case "LOAD":
          payload.load = optionalNumber(load);
          payload.weightUnit = weightUnit;
          break;
      }

      const submittedMovements = getSubmittedMovements();

      if (isEditing) {
        // An empty array means "remove the previously logged movement
        // performances". Omitting the property would preserve them.
        payload.movements = submittedMovements;
      } else if (submittedMovements.length > 0) {
        payload.movements = submittedMovements;
      }

      const url =
        isEditing && result
          ? `/api/workouts/${workoutId}/results/${result.id}`
          : `/api/workouts/${workoutId}/results`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
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

        setError(message ?? t("validation.saveError"));
        return;
      }

      if (!isEditing) {
        resetForm();
        setSuccess(true);
      }

      router.refresh();
      onSaved?.();
    } catch {
      setError(t("validation.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setPrescriptionCategoryKey(defaultPrescriptionCategoryKey);
    setMinutes("");
    setSeconds("");
    setRounds("");
    setReps("");
    setLoad("");
    setWeightUnit(preferredWeightUnit);
    setMovementPerformances({});
    setPerformedDate(getLocalDateValue());
    setPerformedTime(getLocalTimeValue());
    setNotes("");
    setMovementDetailsOpen(false);
    setResultDetailsOpen(false);
    setScoreErrors({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6"
      noValidate
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {isEditing ? t("editEyebrow") : t("eyebrow")}
        </p>

        <h3 className="mt-1 text-xl font-bold">
          {isEditing ? t("editTitle") : localizedResultType}
        </h3>

        <p className="mt-1 text-sm text-muted">
          {isEditing ? t("editDescription") : t("description")}
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {prescriptionCategories.length > 0 && (
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-medium">
              {t("prescriptionCategory")}
              <span className="ml-1 font-normal text-muted">
                {t("optional")}
              </span>
            </legend>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!prescriptionCategoryKey}
                onClick={() => setPrescriptionCategoryKey("")}
                className={[
                  "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  !prescriptionCategoryKey
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-muted hover:bg-surface-elevated hover:text-foreground",
                ].join(" ")}
              >
                {t("noPrescriptionCategory")}
              </button>

              {prescriptionCategories.map((category) => {
                const selected = prescriptionCategoryKey === category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPrescriptionCategoryKey(category.key)}
                    className={[
                      "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      selected
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted hover:bg-surface-elevated hover:text-foreground",
                    ].join(" ")}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <section className="md:col-span-2 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {t("score")}
          </p>

          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            {resultType.key === "TIME" && (
              <>
                <NumberField
                  id={isEditing ? "editMinutes" : "minutes"}
                  label={t("minutes")}
                  value={minutes}
                  onChange={(value) =>
                    updateScoreField("minutes", setMinutes, value)
                  }
                  error={scoreErrors.minutes}
                  placeholder="5"
                />

                <NumberField
                  id={isEditing ? "editSeconds" : "seconds"}
                  label={t("seconds")}
                  value={seconds}
                  onChange={(value) =>
                    updateScoreField("seconds", setSeconds, value)
                  }
                  error={scoreErrors.seconds}
                  placeholder="58"
                  max={59}
                />
              </>
            )}

            {resultType.key === "ROUNDS_REPS" && (
              <>
                <NumberField
                  id={isEditing ? "editRounds" : "rounds"}
                  label={t("rounds")}
                  value={rounds}
                  onChange={(value) =>
                    updateScoreField("rounds", setRounds, value)
                  }
                  error={scoreErrors.rounds}
                  placeholder="7"
                />

                <NumberField
                  id={isEditing ? "editReps" : "reps"}
                  label={t("extraReps")}
                  value={reps}
                  onChange={(value) =>
                    updateScoreField("reps", setReps, value)
                  }
                  error={scoreErrors.reps}
                  placeholder="12"
                />
              </>
            )}

            {resultType.key === "REPS" && (
              <NumberField
                id={isEditing ? "editReps" : "reps"}
                label={t("reps")}
                value={reps}
                onChange={(value) =>
                  updateScoreField("reps", setReps, value)
                }
                error={scoreErrors.reps}
                placeholder="50"
                className="sm:col-span-2"
              />
            )}

            {resultType.key === "LOAD" && (
              <>
                <NumberField
                  id={isEditing ? "editLoad" : "load"}
                  label={t("load")}
                  value={load}
                  onChange={(value) =>
                    updateScoreField("load", setLoad, value)
                  }
                  error={scoreErrors.load}
                  placeholder="100"
                  step="0.1"
                  suffix={weightUnit}
                />

                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium">
                    {t("unit")}
                  </legend>

                  <div className="inline-flex rounded-lg border border-border bg-background p-1">
                    {(["KG", "LB"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={weightUnit === unit}
                        onClick={() => setWeightUnit(unit)}
                        className={[
                          "min-h-10 min-w-16 rounded-md px-4 py-2 text-sm font-semibold transition",
                          weightUnit === unit
                            ? "bg-accent text-accent-foreground"
                            : "text-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
          </div>
        </section>

        {trackableMovements.length > 0 && (
          <section className="md:col-span-2 rounded-xl border border-border bg-background">
            <button
              type="button"
              aria-expanded={movementDetailsOpen}
              aria-controls="workout-movement-results"
              onClick={() => setMovementDetailsOpen((open) => !open)}
              className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {t("movementDetails")}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t("movementDetailsDescription", {
                    count: trackableMovements.length,
                  })}
                </span>
              </span>
              <span aria-hidden="true" className="text-muted">
                {movementDetailsOpen ? "−" : "+"}
              </span>
            </button>

            {movementDetailsOpen && (
              <div
                id="workout-movement-results"
                tabIndex={-1}
                className="space-y-4 border-t border-border p-4"
              >
                {trackableMovements.map((item) => {
                  const performance = getMovementPerformance(item.id);
                  const measurementKeys = getMeasurementKeys(item);

                  const supportsWeight = measurementKeys.has("WEIGHT");
                  const supportsReps = measurementKeys.has("REPS");
                  const supportsDistance = measurementKeys.has("DISTANCE");
                  const supportsDuration = measurementKeys.has("DURATION");
                  const supportsCalories = measurementKeys.has("CALORIES");

                  const showReps = supportsWeight || supportsReps;

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{item.movement.name}</p>

                        <div className="flex flex-wrap gap-1.5">
                          {item.movement.measurementTypes.map((type) => (
                            <span
                              key={type.key}
                              className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted"
                            >
                              {type.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {showReps && (
                          <NumberField
                            id={`${
                              isEditing ? "edit-" : ""
                            }movement-${item.id}-reps`}
                            label={movementBuilderT("reps")}
                            value={performance.reps}
                            onChange={(value) =>
                              updateMovementPerformance(item.id, {
                                reps: value,
                              })
                            }
                            placeholder="5"
                          />
                        )}

                        {supportsWeight && (
                          <>
                            <NumberField
                              id={`${
                                isEditing ? "edit-" : ""
                              }movement-${item.id}-load`}
                              label={movementBuilderT("weight")}
                              value={performance.load}
                              onChange={(value) =>
                                updateMovementPerformance(item.id, {
                                  load: value,
                                })
                              }
                              placeholder="100"
                              step="0.1"
                            />

                            <div>
                              <label
                                htmlFor={`${
                                  isEditing ? "edit-" : ""
                                }movement-${item.id}-unit`}
                                className="mb-1.5 block text-sm font-medium"
                              >
                                {movementBuilderT("unit")}
                              </label>

                              <select
                                id={`${
                                  isEditing ? "edit-" : ""
                                }movement-${item.id}-unit`}
                                value={performance.weightUnit}
                                onChange={(event) =>
                                  updateMovementPerformance(item.id, {
                                    weightUnit: event.target
                                      .value as WeightUnit,
                                  })
                                }
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              >
                                <option value="KG">KG</option>
                                <option value="LB">LB</option>
                              </select>
                            </div>
                          </>
                        )}

                        {supportsDistance && (
                          <NumberField
                            id={`${
                              isEditing ? "edit-" : ""
                            }movement-${item.id}-distance`}
                            label={movementBuilderT("distance")}
                            value={performance.distance}
                            onChange={(value) =>
                              updateMovementPerformance(item.id, {
                                distance: value,
                              })
                            }
                            placeholder="1000"
                            step="0.1"
                          />
                        )}

                        {supportsDuration && (
                          <div className="sm:col-span-2 lg:col-span-2">
                            <p className="mb-1.5 text-sm font-medium">
                              {movementBuilderT("duration")}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <NumberField
                                id={`${
                                  isEditing ? "edit-" : ""
                                }movement-${item.id}-duration-minutes`}
                                label={t("minutes")}
                                value={performance.durationMinutes}
                                onChange={(value) =>
                                  updateMovementPerformance(item.id, {
                                    durationMinutes: value,
                                  })
                                }
                                placeholder="3"
                              />

                              <NumberField
                                id={`${
                                  isEditing ? "edit-" : ""
                                }movement-${item.id}-duration-seconds`}
                                label={t("seconds")}
                                value={performance.durationSeconds}
                                onChange={(value) =>
                                  updateMovementPerformance(item.id, {
                                    durationSeconds: value,
                                  })
                                }
                                placeholder="42"
                                max={59}
                              />
                            </div>
                          </div>
                        )}

                        {supportsCalories && (
                          <NumberField
                            id={`${
                              isEditing ? "edit-" : ""
                            }movement-${item.id}-calories`}
                            label={movementBuilderT("calories")}
                            value={performance.calories}
                            onChange={(value) =>
                              updateMovementPerformance(item.id, {
                                calories: value,
                              })
                            }
                            placeholder="20"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="md:col-span-2 rounded-xl border border-border bg-background">
          <button
            type="button"
            aria-expanded={resultDetailsOpen}
            aria-controls="workout-result-details"
            onClick={() => setResultDetailsOpen((open) => !open)}
            className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold">
                {t("resultDetails")}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {t("resultDetailsSummary", {
                  date: formatSelectedDate(performedDate),
                  time: formatSelectedTime(performedTime),
                })}
              </span>
            </span>
            <span aria-hidden="true" className="text-muted">
              {resultDetailsOpen ? "−" : "+"}
            </span>
          </button>

          {resultDetailsOpen && (
            <div
              id="workout-result-details"
              tabIndex={-1}
              className="border-t border-border p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">{t("performedAt")}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPerformedDate(getLocalDateValue())}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {t("today")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerformedTime(getLocalTimeValue())}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {t("now")}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                {t("date")}
              </p>

              <button
                type="button"
                onClick={openDatePicker}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedDate(performedDate)}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">{t("chooseDate")}</p>
                </div>

                <span aria-hidden="true" className="text-lg text-muted">
                  ◫
                </span>
              </button>

              <input
                ref={dateInputRef}
                type="date"
                value={performedDate}
                onChange={(event) => setPerformedDate(event.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
                </div>

                <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                {t("time")}
              </p>

              <button
                type="button"
                onClick={openTimePicker}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedTime(performedTime)}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">{t("chooseTime")}</p>
                </div>

                <span aria-hidden="true" className="text-lg text-muted">
                  ◷
                </span>
              </button>

              <input
                ref={timeInputRef}
                type="time"
                value={performedTime}
                onChange={(event) => setPerformedTime(event.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
                </div>
              </div>

              <p className="mt-2 text-xs text-muted">
                {t("performedAtHelp")}
              </p>

              <div className="mt-5">
                <label
                  htmlFor={isEditing ? "editWorkoutNotes" : "notes"}
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("notes")}

                  <span className="ml-1 font-normal text-muted">
                    {t("optional")}
                  </span>
                </label>

                <textarea
                  id={isEditing ? "editWorkoutNotes" : "notes"}
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mt-5">
          {t("saved")}
        </Alert>
      )}

      <div className="sticky bottom-20 z-10 -mx-2 mt-6 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {isEditing && onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full px-5 sm:w-auto"
            >
              {t("cancel")}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !workoutVariantId}
            isLoading={isSubmitting}
            className="w-full px-5 sm:w-auto"
          >
            {isSubmitting
              ? isEditing
                ? t("updating")
                : t("saving")
              : isEditing
                ? t("update")
                : t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
