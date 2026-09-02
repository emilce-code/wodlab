"use client";

import { FormEvent, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import ResultNumberField from "@/components/results/ResultNumberField";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { formatCalendarDate, formatClockTime } from "@/lib/date-formatters";

import {
  MeasurementType,
  MovementResult,
  WeightUnit,
} from "../movement-result.types";

type Props = {
  movementId: string;
  measurementTypes: MeasurementType[];
  preferredWeightUnit?: WeightUnit;
  result?: MovementResult;
  onCancel?: () => void;
  onSaved?: () => void;
};

type FieldErrors = Partial<
  Record<
    | "measurementType"
    | "reps"
    | "load"
    | "distance"
    | "durationMinutes"
    | "durationSeconds"
    | "calories"
    | "performedDate"
    | "performedTime",
    string
  >
>;

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

function toNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function isPositiveNumber(value: string) {
  const parsed = toNumber(value);

  return parsed !== undefined && parsed > 0;
}

export default function LogMovementResultForm({
  movementId,
  measurementTypes,
  preferredWeightUnit = "KG",
  result,
  onCancel,
  onSaved,
}: Props) {
  const t = useTranslations("movements.detail.logResult");
  const measurementT = useTranslations("measurementTypes");
  const locale = useLocale();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = Boolean(result);
  const resultDate = result ? new Date(result.performedAt) : null;
  const initialDurationSeconds = result?.durationSeconds ?? 0;

  const [measurementTypeKey, setMeasurementTypeKey] = useState(
    result?.measurementType.key ?? measurementTypes[0]?.key ?? "",
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
  const [distance, setDistance] = useState(
    result?.distance !== null && result?.distance !== undefined
      ? String(result.distance)
      : "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    result?.durationSeconds !== null && result?.durationSeconds !== undefined
      ? String(Math.floor(initialDurationSeconds / 60))
      : "",
  );
  const [durationSeconds, setDurationSeconds] = useState(
    result?.durationSeconds !== null && result?.durationSeconds !== undefined
      ? String(initialDurationSeconds % 60)
      : "",
  );
  const [calories, setCalories] = useState(
    result?.calories !== null && result?.calories !== undefined
      ? String(result.calories)
      : "",
  );
  const [performedDate, setPerformedDate] = useState(
    resultDate ? getLocalDateValue(resultDate) : getLocalDateValue(),
  );
  const [performedTime, setPerformedTime] = useState(
    resultDate ? getLocalTimeValue(resultDate) : getLocalTimeValue(),
  );
  const [notes, setNotes] = useState(result?.notes ?? "");
  const [detailsOpen, setDetailsOpen] = useState(
    isEditing || Boolean(result?.notes),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getMeasurementName(type: MeasurementType) {
    const key = type.key.toLowerCase();

    return measurementT.has(key) ? measurementT(key) : type.name;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const errors: FieldErrors = {};

    if (!measurementTypeKey) {
      errors.measurementType = t("validation.measurementRequired");
    }

    switch (measurementTypeKey) {
      case "REPS":
        if (!isPositiveNumber(reps)) {
          errors.reps = t("validation.repsRequired");
        }
        break;

      case "WEIGHT":
        if (!isPositiveNumber(reps)) {
          errors.reps = t("validation.repsRequired");
        }
        if (!isPositiveNumber(load)) {
          errors.load = t("validation.loadRequired");
        }
        break;

      case "DISTANCE":
        if (!isPositiveNumber(distance)) {
          errors.distance = t("validation.distanceRequired");
        }
        break;

      case "DURATION": {
        const minutes = toNumber(durationMinutes) ?? 0;
        const seconds = toNumber(durationSeconds) ?? 0;

        if (minutes < 0) {
          errors.durationMinutes = t("validation.durationRequired");
        }
        if (seconds < 0 || seconds > 59) {
          errors.durationSeconds = t("validation.invalidSeconds");
        }
        if (minutes === 0 && seconds === 0) {
          errors.durationMinutes = t("validation.durationRequired");
        }
        break;
      }

      case "CALORIES":
        if (!isPositiveNumber(calories)) {
          errors.calories = t("validation.caloriesRequired");
        }
        break;
    }

    if (!performedDate) {
      errors.performedDate = t("validation.performedAtRequired");
    }
    if (!performedTime) {
      errors.performedTime = t("validation.performedAtRequired");
    }

    return errors;
  }

  function focusFirstError(errors: FieldErrors) {
    const needsDetails = Boolean(errors.performedDate || errors.performedTime);

    if (needsDetails) {
      setDetailsOpen(true);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    });
  }

  function resetForm() {
    setMeasurementTypeKey(measurementTypes[0]?.key ?? "");
    setReps("");
    setLoad("");
    setWeightUnit(preferredWeightUnit);
    setDistance("");
    setDurationMinutes("");
    setDurationSeconds("");
    setCalories("");
    setPerformedDate(getLocalDateValue());
    setPerformedTime(getLocalTimeValue());
    setNotes("");
    setDetailsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload: {
        measurementTypeKey: string;
        performedAt: string;
        reps?: number;
        load?: number;
        weightUnit?: WeightUnit;
        distance?: number;
        durationSeconds?: number;
        calories?: number;
        notes?: string;
      } = {
        measurementTypeKey,
        performedAt: new Date(
          `${performedDate}T${performedTime}`,
        ).toISOString(),
        notes: notes.trim(),
      };

      switch (measurementTypeKey) {
        case "REPS":
          payload.reps = toNumber(reps);
          break;
        case "WEIGHT":
          payload.reps = toNumber(reps);
          payload.load = toNumber(load);
          payload.weightUnit = weightUnit;
          break;
        case "DISTANCE":
          payload.distance = toNumber(distance);
          break;
        case "DURATION":
          payload.durationSeconds =
            (toNumber(durationMinutes) ?? 0) * 60 +
            (toNumber(durationSeconds) ?? 0);
          break;
        case "CALORIES":
          payload.calories = toNumber(calories);
          break;
      }

      const url =
        isEditing && result
          ? `/api/movements/${movementId}/results/${result.id}`
          : `/api/movements/${movementId}/results`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string | string[] };

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : (data.message ?? t("validation.saveError")),
        );
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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6"
      noValidate
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {isEditing ? t("editEyebrow") : t("eyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-bold">
          {isEditing ? t("editTitle") : t("title")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEditing ? t("editDescription") : t("description")}
        </p>
      </div>

      {measurementTypes.length > 1 && (
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">{t("measurementType")}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {measurementTypes.map((type) => {
              const selected = type.key === measurementTypeKey;

              return (
                <button
                  key={type.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setMeasurementTypeKey(type.key);
                    setFieldErrors({});
                    setError(null);
                    setSuccess(false);
                  }}
                  className={[
                    "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted hover:bg-surface-elevated hover:text-foreground",
                  ].join(" ")}
                >
                  {getMeasurementName(type)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <section className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {t("score")}
        </p>

        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          {measurementTypeKey === "REPS" && (
            <ResultNumberField
              id={isEditing ? "editMovementReps" : "movementReps"}
              label={t("reps")}
              value={reps}
              onChange={(value) => {
                setReps(value);
                clearFieldError("reps");
              }}
              error={fieldErrors.reps}
              placeholder="10"
              min="1"
              className="sm:col-span-2"
            />
          )}

          {measurementTypeKey === "WEIGHT" && (
            <>
              <ResultNumberField
                id={isEditing ? "editMovementReps" : "movementReps"}
                label={t("reps")}
                value={reps}
                onChange={(value) => {
                  setReps(value);
                  clearFieldError("reps");
                }}
                error={fieldErrors.reps}
                placeholder="1"
                min="1"
              />
              <ResultNumberField
                id={isEditing ? "editMovementLoad" : "movementLoad"}
                label={t("load")}
                value={load}
                onChange={(value) => {
                  setLoad(value);
                  clearFieldError("load");
                }}
                error={fieldErrors.load}
                placeholder="100"
                min="0.1"
                step="0.1"
                suffix={weightUnit}
              />
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-sm font-medium">
                  {t("weightUnit")}
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

          {measurementTypeKey === "DISTANCE" && (
            <ResultNumberField
              id={isEditing ? "editMovementDistance" : "movementDistance"}
              label={t("distance")}
              value={distance}
              onChange={(value) => {
                setDistance(value);
                clearFieldError("distance");
              }}
              error={fieldErrors.distance}
              placeholder="5000"
              min="0.1"
              step="0.1"
              suffix="m"
              className="sm:col-span-2"
            />
          )}

          {measurementTypeKey === "DURATION" && (
            <>
              <ResultNumberField
                id={isEditing ? "editDurationMinutes" : "durationMinutes"}
                label={t("minutes")}
                value={durationMinutes}
                onChange={(value) => {
                  setDurationMinutes(value);
                  clearFieldError("durationMinutes");
                }}
                error={fieldErrors.durationMinutes}
                placeholder="5"
                min="0"
                suffix="min"
              />
              <ResultNumberField
                id={isEditing ? "editDurationSeconds" : "durationSeconds"}
                label={t("seconds")}
                value={durationSeconds}
                onChange={(value) => {
                  setDurationSeconds(value);
                  clearFieldError("durationSeconds");
                }}
                error={fieldErrors.durationSeconds}
                placeholder="30"
                min="0"
                max="59"
                suffix="sec"
              />
            </>
          )}

          {measurementTypeKey === "CALORIES" && (
            <ResultNumberField
              id={isEditing ? "editMovementCalories" : "movementCalories"}
              label={t("calories")}
              value={calories}
              onChange={(value) => {
                setCalories(value);
                clearFieldError("calories");
              }}
              error={fieldErrors.calories}
              placeholder="50"
              min="1"
              suffix="cal"
              className="sm:col-span-2"
            />
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-background">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls="movement-result-details"
          onClick={() => setDetailsOpen((open) => !open)}
          className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">{t("resultDetails")}</span>
            <span className="mt-0.5 block text-xs text-muted">
              {t("resultDetailsSummary", {
                date: performedDate
                  ? formatCalendarDate(performedDate, locale)
                  : t("date"),
                time: performedTime
                  ? formatClockTime(performedTime, locale)
                  : t("time"),
              })}
            </span>
          </span>
          <span aria-hidden="true" className="text-muted">
            {detailsOpen ? "−" : "+"}
          </span>
        </button>

        {detailsOpen && (
          <div id="movement-result-details" className="border-t border-border p-4">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="movementPerformedDate" className="text-sm font-medium">
                    {t("date")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPerformedDate(getLocalDateValue());
                      clearFieldError("performedDate");
                    }}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {t("today")}
                  </button>
                </div>
                <input
                  id="movementPerformedDate"
                  type="date"
                  value={performedDate}
                  onChange={(event) => {
                    setPerformedDate(event.target.value);
                    clearFieldError("performedDate");
                  }}
                  aria-invalid={Boolean(fieldErrors.performedDate)}
                  aria-describedby={
                    fieldErrors.performedDate
                      ? "movementPerformedDate-error"
                      : undefined
                  }
                  className="min-h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
                {fieldErrors.performedDate && (
                  <p
                    id="movementPerformedDate-error"
                    className="mt-1.5 text-sm text-red-500"
                  >
                    {fieldErrors.performedDate}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="movementPerformedTime" className="text-sm font-medium">
                    {t("time")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPerformedTime(getLocalTimeValue());
                      clearFieldError("performedTime");
                    }}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {t("now")}
                  </button>
                </div>
                <input
                  id="movementPerformedTime"
                  type="time"
                  value={performedTime}
                  onChange={(event) => {
                    setPerformedTime(event.target.value);
                    clearFieldError("performedTime");
                  }}
                  aria-invalid={Boolean(fieldErrors.performedTime)}
                  aria-describedby={
                    fieldErrors.performedTime
                      ? "movementPerformedTime-error"
                      : undefined
                  }
                  className="min-h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
                {fieldErrors.performedTime && (
                  <p
                    id="movementPerformedTime-error"
                    className="mt-1.5 text-sm text-red-500"
                  >
                    {fieldErrors.performedTime}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="movementNotes" className="mb-1.5 block text-sm font-medium">
                  {t("notes")} <span className="font-normal text-muted">{t("optional")}</span>
                </label>
                <textarea
                  id="movementNotes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {error && <Alert variant="error" className="mt-5">{error}</Alert>}
      {success && <Alert variant="success" className="mt-5">{t("saved")}</Alert>}

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
            disabled={isSubmitting || !measurementTypeKey}
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
