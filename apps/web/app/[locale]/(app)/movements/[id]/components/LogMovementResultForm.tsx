'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useRouter } from '@/i18n/navigation';

import {
  MeasurementType,
  MovementResult,
  WeightUnit,
} from '../movement-result.types';

type Props = {
  movementId: string;
  measurementTypes: MeasurementType[];
  preferredWeightUnit?: WeightUnit;
  result?: MovementResult;
  onCancel?: () => void;
  onSaved?: () => void;
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getLocalTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export default function LogMovementResultForm({
  movementId,
  measurementTypes,
  preferredWeightUnit = 'KG',
  result,
  onCancel,
  onSaved,
}: Props) {
  const t = useTranslations('movements.detail.logResult');
  const measurementT = useTranslations('measurementTypes');
  const router = useRouter();

  const isEditing = Boolean(result);
  const resultDate = result ? new Date(result.performedAt) : null;
  const initialDurationSeconds = result?.durationSeconds ?? 0;

  const [measurementTypeKey, setMeasurementTypeKey] = useState(
    result?.measurementType.key ?? measurementTypes[0]?.key ?? '',
  );

  const [reps, setReps] = useState(
    result?.reps !== null && result?.reps !== undefined
      ? String(result.reps)
      : '',
  );

  const [load, setLoad] = useState(
    result?.load !== null && result?.load !== undefined
      ? String(result.load)
      : '',
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    result?.weightUnit ?? preferredWeightUnit,
  );

  const [distance, setDistance] = useState(
    result?.distance !== null && result?.distance !== undefined
      ? String(result.distance)
      : '',
  );

  const [durationMinutes, setDurationMinutes] = useState(
    result?.durationSeconds !== null && result?.durationSeconds !== undefined
      ? String(Math.floor(initialDurationSeconds / 60))
      : '',
  );

  const [durationSeconds, setDurationSeconds] = useState(
    result?.durationSeconds !== null && result?.durationSeconds !== undefined
      ? String(initialDurationSeconds % 60)
      : '',
  );

  const [calories, setCalories] = useState(
    result?.calories !== null && result?.calories !== undefined
      ? String(result.calories)
      : '',
  );

  const [performedDate, setPerformedDate] = useState(
    resultDate ? getLocalDateValue(resultDate) : getLocalDateValue(),
  );

  const [performedTime, setPerformedTime] = useState(
    resultDate ? getLocalTimeValue(resultDate) : getLocalTimeValue(),
  );

  const [notes, setNotes] = useState(result?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getMeasurementName(type: MeasurementType) {
    const key = type.key.toLowerCase();

    return measurementT.has(key) ? measurementT(key) : type.name;
  }

  function toNumber(value: string) {
    if (!value.trim()) {
      return undefined;
    }

    return Number(value);
  }

  function validate() {
    if (!measurementTypeKey) {
      return t('validation.measurementRequired');
    }

    switch (measurementTypeKey) {
      case 'REPS':
        if (!reps.trim()) {
          return t('validation.repsRequired');
        }

        break;

      case 'WEIGHT':
        if (!load.trim()) {
          return t('validation.loadRequired');
        }

        if (!reps.trim()) {
          return t('validation.repsRequired');
        }

        break;

      case 'DISTANCE':
        if (!distance.trim()) {
          return t('validation.distanceRequired');
        }

        break;

      case 'DURATION': {
        const minutes = toNumber(durationMinutes) ?? 0;
        const seconds = toNumber(durationSeconds) ?? 0;

        if (minutes === 0 && seconds === 0) {
          return t('validation.durationRequired');
        }

        if (seconds < 0 || seconds > 59) {
          return t('validation.invalidSeconds');
        }

        break;
      }

      case 'CALORIES':
        if (!calories.trim()) {
          return t('validation.caloriesRequired');
        }

        break;
    }

    if (!performedDate || !performedTime) {
      return t('validation.performedAtRequired');
    }

    return null;
  }

  function resetForm() {
    setMeasurementTypeKey(measurementTypes[0]?.key ?? '');
    setReps('');
    setLoad('');
    setWeightUnit(preferredWeightUnit);
    setDistance('');
    setDurationMinutes('');
    setDurationSeconds('');
    setCalories('');
    setPerformedDate(getLocalDateValue());
    setPerformedTime(getLocalTimeValue());
    setNotes('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

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
        case 'REPS':
          payload.reps = toNumber(reps);
          break;

        case 'WEIGHT':
          payload.reps = toNumber(reps);
          payload.load = toNumber(load);
          payload.weightUnit = weightUnit;
          break;

        case 'DISTANCE':
          payload.distance = toNumber(distance);
          break;

        case 'DURATION':
          payload.durationSeconds =
            (toNumber(durationMinutes) ?? 0) * 60 +
            (toNumber(durationSeconds) ?? 0);
          break;

        case 'CALORIES':
          payload.calories = toNumber(calories);
          break;
      }

      const url =
        isEditing && result
          ? `/api/movements/${movementId}/results/${result.id}`
          : `/api/movements/${movementId}/results`;

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        setError(message ?? t('validation.saveError'));
        return;
      }

      if (!isEditing) {
        resetForm();
        setSuccess(true);
      }

      router.refresh();
      onSaved?.();
    } catch {
      setError(t('validation.connectionError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {isEditing ? t('editEyebrow') : t('eyebrow')}
        </p>

        <h2 className="mt-1 text-xl font-bold">
          {isEditing ? t('editTitle') : t('title')}
        </h2>

        <p className="mt-1 text-sm text-muted">
          {isEditing ? t('editDescription') : t('description')}
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {measurementTypes.length > 1 && (
          <div className="sm:col-span-2">
            <label
              htmlFor={isEditing ? 'editMeasurementType' : 'measurementType'}
              className="mb-1.5 block text-sm font-medium"
            >
              {t('measurementType')}
            </label>

            <select
              id={isEditing ? 'editMeasurementType' : 'measurementType'}
              value={measurementTypeKey}
              onChange={(event) => {
                setMeasurementTypeKey(event.target.value);
                setError(null);
                setSuccess(false);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              {measurementTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {getMeasurementName(type)}
                </option>
              ))}
            </select>
          </div>
        )}

        {measurementTypeKey === 'REPS' && (
          <NumberField
            id={isEditing ? 'editMovementReps' : 'movementReps'}
            label={t('reps')}
            value={reps}
            onChange={setReps}
            placeholder="10"
          />
        )}

        {measurementTypeKey === 'WEIGHT' && (
          <>
            <NumberField
              id={isEditing ? 'editMovementReps' : 'movementReps'}
              label={t('reps')}
              value={reps}
              onChange={setReps}
              placeholder="1"
            />

            <NumberField
              id={isEditing ? 'editMovementLoad' : 'movementLoad'}
              label={t('load')}
              value={load}
              onChange={setLoad}
              placeholder="100"
              step="0.1"
            />

            <div>
              <label
                htmlFor={
                  isEditing
                    ? 'editMovementWeightUnit'
                    : 'movementWeightUnit'
                }
                className="mb-1.5 block text-sm font-medium"
              >
                {t('weightUnit')}
              </label>

              <select
                id={
                  isEditing
                    ? 'editMovementWeightUnit'
                    : 'movementWeightUnit'
                }
                value={weightUnit}
                onChange={(event) =>
                  setWeightUnit(event.target.value as WeightUnit)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              >
                <option value="KG">KG</option>
                <option value="LB">LB</option>
              </select>
            </div>
          </>
        )}

        {measurementTypeKey === 'DISTANCE' && (
          <NumberField
            id={isEditing ? 'editMovementDistance' : 'movementDistance'}
            label={t('distanceMeters')}
            value={distance}
            onChange={setDistance}
            placeholder="5000"
          />
        )}

        {measurementTypeKey === 'DURATION' && (
          <>
            <NumberField
              id={isEditing ? 'editDurationMinutes' : 'durationMinutes'}
              label={t('minutes')}
              value={durationMinutes}
              onChange={setDurationMinutes}
              placeholder="5"
            />

            <NumberField
              id={isEditing ? 'editDurationSeconds' : 'durationSeconds'}
              label={t('seconds')}
              value={durationSeconds}
              onChange={setDurationSeconds}
              placeholder="30"
              max={59}
            />
          </>
        )}

        {measurementTypeKey === 'CALORIES' && (
          <NumberField
            id={isEditing ? 'editMovementCalories' : 'movementCalories'}
            label={t('calories')}
            value={calories}
            onChange={setCalories}
            placeholder="50"
          />
        )}

        <div>
          <label
            htmlFor={isEditing ? 'editPerformedDate' : 'performedDate'}
            className="mb-1.5 block text-sm font-medium"
          >
            {t('date')}
          </label>

          <input
            id={isEditing ? 'editPerformedDate' : 'performedDate'}
            type="date"
            value={performedDate}
            onChange={(event) => setPerformedDate(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div>
          <label
            htmlFor={isEditing ? 'editPerformedTime' : 'performedTime'}
            className="mb-1.5 block text-sm font-medium"
          >
            {t('time')}
          </label>

          <input
            id={isEditing ? 'editPerformedTime' : 'performedTime'}
            type="time"
            value={performedTime}
            onChange={(event) => setPerformedTime(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={isEditing ? 'editMovementNotes' : 'movementNotes'}
            className="mb-1.5 block text-sm font-medium"
          >
            {t('notes')}

            <span className="ml-1 font-normal text-muted">
              {t('optional')}
            </span>
          </label>

          <textarea
            id={isEditing ? 'editMovementNotes' : 'movementNotes'}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('notesPlaceholder')}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mt-5">
          {t('saved')}
        </Alert>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full px-5 sm:w-auto"
          >
            {t('cancel')}
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !measurementTypeKey}
          className="w-full px-5 sm:w-auto"
        >
          {isSubmitting
            ? isEditing
              ? t('updating')
              : t('saving')
            : isEditing
              ? t('update')
              : t('save')}
        </Button>
      </div>
    </form>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  max?: number;
  step?: string;
};

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  max,
  step,
}: NumberFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={id}
        type="number"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
      />
    </div>
  );
}
