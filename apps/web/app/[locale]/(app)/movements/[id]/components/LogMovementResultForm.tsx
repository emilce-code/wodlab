'use client';

import {
  FormEvent,
  useState,
} from 'react';
import {
  useTranslations,
} from 'next-intl';

import {
  useRouter,
} from '@/i18n/navigation';

type WeightUnit =
  | 'KG'
  | 'LB';

type MeasurementType = {
  key: string;
  name: string;
};

type Props = {
  movementId: string;

  measurementTypes:
    MeasurementType[];

  preferredWeightUnit?:
    WeightUnit;
};

function getLocalDateValue() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}

function getLocalTimeValue() {
  const now =
    new Date();

  const hours =
    String(
      now.getHours(),
    ).padStart(
      2,
      '0',
    );

  const minutes =
    String(
      now.getMinutes(),
    ).padStart(
      2,
      '0',
    );

  return `${hours}:${minutes}`;
}

export default function LogMovementResultForm({
  movementId,
  measurementTypes,
  preferredWeightUnit = 'KG',
}: Props) {
  const t =
    useTranslations(
      'movements.detail.logResult',
    );

  const measurementT =
    useTranslations(
      'measurementTypes',
    );

  const router =
    useRouter();

  const defaultMeasurementType =
    measurementTypes[0]
      ?.key ?? '';

  const [
    measurementTypeKey,
    setMeasurementTypeKey,
  ] = useState(
    defaultMeasurementType,
  );

  const [
    reps,
    setReps,
  ] = useState('');

  const [
    load,
    setLoad,
  ] = useState('');

  const [
    weightUnit,
    setWeightUnit,
  ] =
    useState<WeightUnit>(
      preferredWeightUnit,
    );

  const [
    distance,
    setDistance,
  ] = useState('');

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState('');

  const [
    durationSeconds,
    setDurationSeconds,
  ] = useState('');

  const [
    calories,
    setCalories,
  ] = useState('');

  const [
    performedDate,
    setPerformedDate,
  ] = useState(
    getLocalDateValue,
  );

  const [
    performedTime,
    setPerformedTime,
  ] = useState(
    getLocalTimeValue,
  );

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  function getMeasurementName(
    type: MeasurementType,
  ) {
    const key =
      type.key.toLowerCase();

    return measurementT.has(
      key,
    )
      ? measurementT(key)
      : type.name;
  }

  function toNumber(
    value: string,
  ) {
    if (!value.trim()) {
      return undefined;
    }

    return Number(value);
  }

  function validate() {
    if (
      !measurementTypeKey
    ) {
      return t(
        'validation.measurementRequired',
      );
    }

    switch (
      measurementTypeKey
    ) {
      case 'REPS':
        if (!reps.trim()) {
          return t(
            'validation.repsRequired',
          );
        }

        break;

      case 'WEIGHT':
        if (!load.trim()) {
          return t(
            'validation.loadRequired',
          );
        }

        if (!reps.trim()) {
          return t(
            'validation.repsRequired',
          );
        }

        break;

      case 'DISTANCE':
        if (
          !distance.trim()
        ) {
          return t(
            'validation.distanceRequired',
          );
        }

        break;

      case 'DURATION': {
        const minutes =
          toNumber(
            durationMinutes,
          ) ?? 0;

        const seconds =
          toNumber(
            durationSeconds,
          ) ?? 0;

        if (
          minutes === 0 &&
          seconds === 0
        ) {
          return t(
            'validation.durationRequired',
          );
        }

        if (
          seconds < 0 ||
          seconds > 59
        ) {
          return t(
            'validation.invalidSeconds',
          );
        }

        break;
      }

      case 'CALORIES':
        if (
          !calories.trim()
        ) {
          return t(
            'validation.caloriesRequired',
          );
        }

        break;
    }

    if (
      !performedDate ||
      !performedTime
    ) {
      return t(
        'validation.performedAtRequired',
      );
    }

    return null;
  }

  function resetForm() {
    setReps('');
    setLoad('');

    setWeightUnit(
      preferredWeightUnit,
    );

    setDistance('');
    setDurationMinutes('');
    setDurationSeconds('');
    setCalories('');

    setPerformedDate(
      getLocalDateValue(),
    );

    setPerformedTime(
      getLocalTimeValue(),
    );

    setNotes('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    const validationError =
      validate();

    if (
      validationError
    ) {
      setError(
        validationError,
      );

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

        performedAt:
          new Date(
            `${performedDate}T${performedTime}`,
          ).toISOString(),
      };

      switch (
        measurementTypeKey
      ) {
        case 'REPS':
          payload.reps =
            toNumber(
              reps,
            );

          break;

        case 'WEIGHT':
          payload.reps =
            toNumber(
              reps,
            );

          payload.load =
            toNumber(
              load,
            );

          payload.weightUnit =
            weightUnit;

          break;

        case 'DISTANCE':
          payload.distance =
            toNumber(
              distance,
            );

          break;

        case 'DURATION':
          payload.durationSeconds =
            (toNumber(
              durationMinutes,
            ) ??
              0) *
              60 +
            (toNumber(
              durationSeconds,
            ) ??
              0);

          break;

        case 'CALORIES':
          payload.calories =
            toNumber(
              calories,
            );

          break;
      }

      if (
        notes.trim()
      ) {
        payload.notes =
          notes.trim();
      }

      const response =
        await fetch(
          `/api/movements/${movementId}/results`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        const message =
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ', ',
              )
            : data.message;

        setError(
          message ??
            t(
              'validation.saveError',
            ),
        );

        return;
      }

      resetForm();

      setSuccess(true);

      router.refresh();
    } catch {
      setError(
        t(
          'validation.connectionError',
        ),
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {t('eyebrow')}
        </p>

        <h2 className="mt-1 text-xl font-bold">
          {t('title')}
        </h2>

        <p className="mt-1 text-sm text-muted">
          {t(
            'description',
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {measurementTypes.length >
          1 && (
          <div className="sm:col-span-2">
            <label
              htmlFor="measurementType"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'measurementType',
              )}
            </label>

            <select
              id="measurementType"
              value={
                measurementTypeKey
              }
              onChange={(
                event,
              ) => {
                setMeasurementTypeKey(
                  event.target
                    .value,
                );

                setError(
                  null,
                );

                setSuccess(
                  false,
                );
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              {measurementTypes.map(
                (type) => (
                  <option
                    key={
                      type.key
                    }
                    value={
                      type.key
                    }
                  >
                    {getMeasurementName(
                      type,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        {measurementTypeKey ===
          'REPS' && (
          <NumberField
            id="movementReps"
            label={t(
              'reps',
            )}
            value={reps}
            onChange={
              setReps
            }
            placeholder="10"
          />
        )}

        {measurementTypeKey ===
          'WEIGHT' && (
          <>
            <NumberField
              id="movementReps"
              label={t(
                'reps',
              )}
              value={reps}
              onChange={
                setReps
              }
              placeholder="1"
            />

            <NumberField
              id="movementLoad"
              label={t(
                'load',
              )}
              value={load}
              onChange={
                setLoad
              }
              placeholder="100"
              step="0.1"
            />

            <div>
              <label
                htmlFor="movementWeightUnit"
                className="mb-1.5 block text-sm font-medium"
              >
                {t(
                  'weightUnit',
                )}
              </label>

              <select
                id="movementWeightUnit"
                value={
                  weightUnit
                }
                onChange={(
                  event,
                ) =>
                  setWeightUnit(
                    event.target
                      .value as WeightUnit,
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              >
                <option value="KG">
                  KG
                </option>

                <option value="LB">
                  LB
                </option>
              </select>
            </div>
          </>
        )}

        {measurementTypeKey ===
          'DISTANCE' && (
          <NumberField
            id="movementDistance"
            label={t(
              'distanceMeters',
            )}
            value={
              distance
            }
            onChange={
              setDistance
            }
            placeholder="5000"
          />
        )}

        {measurementTypeKey ===
          'DURATION' && (
          <>
            <NumberField
              id="durationMinutes"
              label={t(
                'minutes',
              )}
              value={
                durationMinutes
              }
              onChange={
                setDurationMinutes
              }
              placeholder="5"
            />

            <NumberField
              id="durationSeconds"
              label={t(
                'seconds',
              )}
              value={
                durationSeconds
              }
              onChange={
                setDurationSeconds
              }
              placeholder="30"
              max={59}
            />
          </>
        )}

        {measurementTypeKey ===
          'CALORIES' && (
          <NumberField
            id="movementCalories"
            label={t(
              'calories',
            )}
            value={
              calories
            }
            onChange={
              setCalories
            }
            placeholder="50"
          />
        )}

        <div>
          <label
            htmlFor="performedDate"
            className="mb-1.5 block text-sm font-medium"
          >
            {t('date')}
          </label>

          <input
            id="performedDate"
            type="date"
            value={
              performedDate
            }
            onChange={(
              event,
            ) =>
              setPerformedDate(
                event.target
                  .value,
              )
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div>
          <label
            htmlFor="performedTime"
            className="mb-1.5 block text-sm font-medium"
          >
            {t('time')}
          </label>

          <input
            id="performedTime"
            type="time"
            value={
              performedTime
            }
            onChange={(
              event,
            ) =>
              setPerformedTime(
                event.target
                  .value,
              )
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="movementNotes"
            className="mb-1.5 block text-sm font-medium"
          >
            {t('notes')}

            <span className="ml-1 font-normal text-muted">
              {t(
                'optional',
              )}
            </span>
          </label>

          <textarea
            id="movementNotes"
            rows={3}
            value={notes}
            onChange={(
              event,
            ) =>
              setNotes(
                event.target
                  .value,
              )
            }
            placeholder={t(
              'notesPlaceholder',
            )}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent"
        >
          {t(
            'saved',
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !measurementTypeKey
          }
          className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting
            ? t(
                'saving',
              )
            : t(
                'save',
              )}
        </button>
      </div>
    </form>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;

  onChange: (
    value: string,
  ) => void;

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
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
      />
    </div>
  );
}