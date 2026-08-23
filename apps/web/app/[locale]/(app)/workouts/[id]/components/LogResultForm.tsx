'use client';

import {
  FormEvent,
  useRef,
  useState,
} from 'react';
import {
  useLocale,
  useTranslations,
} from 'next-intl';

import {
  useRouter,
} from '@/i18n/navigation';

type ResultType = {
  key: string;
  name: string;
};

type WorkoutVariant = {
  id: string;
  name: string | null;

  level: {
    key: string;
    name: string;
  };
};

type PrescriptionCategory = {
  key: string;
  name: string;
};

type Props = {
  workoutId: string;
  resultType: ResultType;
  variants: WorkoutVariant[];
  prescriptionCategories: PrescriptionCategory[];

  preferredWeightUnit?:
    | 'KG'
    | 'LB';

  preferredWorkoutLevelKey?:
    | string
    | null;

  preferredPrescriptionCategoryKey?:
    | string
    | null;
};

function getLocalDateValue() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    now.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getLocalTimeValue() {
  const now = new Date();

  const hours = String(
    now.getHours(),
  ).padStart(2, '0');

  const minutes = String(
    now.getMinutes(),
  ).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export default function LogResultForm({
  workoutId,
  resultType,
  variants,
  prescriptionCategories,
  preferredWeightUnit = 'KG',
  preferredWorkoutLevelKey = null,
  preferredPrescriptionCategoryKey = null,
}: Props) {
  const t =
    useTranslations(
      'workouts.logResult',
    );

  const resultTypeT =
    useTranslations(
      'resultTypes',
    );

  const locale =
    useLocale();

  const router =
    useRouter();

  const dateInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const timeInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const preferredVariant =
    preferredWorkoutLevelKey
      ? variants.find(
          (variant) =>
            variant.level.key ===
            preferredWorkoutLevelKey,
        )
      : undefined;

  const defaultVariant =
    preferredVariant ??
    variants.find(
      (variant) =>
        variant.level.key ===
        'RX',
    ) ??
    variants[0];

  const defaultPrescriptionCategoryKey =
    preferredPrescriptionCategoryKey &&
    prescriptionCategories.some(
      (category) =>
        category.key ===
        preferredPrescriptionCategoryKey,
    )
      ? preferredPrescriptionCategoryKey
      : '';

  const [
    workoutVariantId,
    setWorkoutVariantId,
  ] = useState(
    defaultVariant?.id ?? '',
  );

  const [
    prescriptionCategoryKey,
    setPrescriptionCategoryKey,
  ] = useState(
    defaultPrescriptionCategoryKey,
  );

  const [
    minutes,
    setMinutes,
  ] = useState('');

  const [
    seconds,
    setSeconds,
  ] = useState('');

  const [
    rounds,
    setRounds,
  ] = useState('');

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
  ] = useState<
    'KG' | 'LB'
  >(
    preferredWeightUnit,
  );

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
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const resultTypeKey =
    resultType.key.toLowerCase();

  const localizedResultType =
    resultTypeT.has(
      resultTypeKey,
    )
      ? resultTypeT(
          resultTypeKey,
        )
      : resultType.name;

  function optionalNumber(
    value: string,
  ): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    return Number(value);
  }

  function formatSelectedDate(
    value: string,
  ) {
    if (!value) {
      return t('selectDate');
    }

    const [
      year,
      month,
      day,
    ] = value
      .split('-')
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    return new Intl.DateTimeFormat(
      locale,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(date);
  }

  function formatSelectedTime(
    value: string,
  ) {
    if (!value) {
      return t('selectTime');
    }

    const [
      hours,
      minutesValue,
    ] = value
      .split(':')
      .map(Number);

    const date = new Date();

    date.setHours(
      hours,
      minutesValue,
      0,
      0,
    );

    return new Intl.DateTimeFormat(
      locale,
      {
        hour: 'numeric',
        minute: '2-digit',
      },
    ).format(date);
  }

  function validate():
    | string
    | null {
    if (!workoutVariantId) {
      return t(
        'validation.variantRequired',
      );
    }

    switch (
      resultType.key
    ) {
      case 'TIME': {
        const minuteValue =
          optionalNumber(
            minutes,
          ) ?? 0;

        const secondValue =
          optionalNumber(
            seconds,
          ) ?? 0;

        if (
          minuteValue === 0 &&
          secondValue === 0
        ) {
          return t(
            'validation.timeRequired',
          );
        }

        if (
          secondValue < 0 ||
          secondValue > 59
        ) {
          return t(
            'validation.invalidSeconds',
          );
        }

        break;
      }

      case 'ROUNDS_REPS': {
        if (
          !rounds.trim() &&
          !reps.trim()
        ) {
          return t(
            'validation.roundsOrRepsRequired',
          );
        }

        break;
      }

      case 'REPS': {
        if (
          !reps.trim()
        ) {
          return t(
            'validation.repsRequired',
          );
        }

        break;
      }

      case 'LOAD': {
        if (
          !load.trim()
        ) {
          return t(
            'validation.loadRequired',
          );
        }

        break;
      }
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

  function getPerformedAtIso() {
    return new Date(
      `${performedDate}T${performedTime}`,
    ).toISOString();
  }

  function openDatePicker() {
    dateInputRef.current?.showPicker();
  }

  function openTimePicker() {
    timeInputRef.current?.showPicker();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

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
        workoutVariantId: string;
        prescriptionCategoryKey?: string;
        performedAt: string;
        timeSeconds?: number;
        rounds?: number;
        reps?: number;
        load?: number;
        weightUnit?:
          | 'KG'
          | 'LB';
        notes?: string;
      } = {
        workoutVariantId,
        performedAt:
          getPerformedAtIso(),
      };

      if (
        prescriptionCategoryKey
      ) {
        payload.prescriptionCategoryKey =
          prescriptionCategoryKey;
      }

      if (
        notes.trim()
      ) {
        payload.notes =
          notes.trim();
      }

      switch (
        resultType.key
      ) {
        case 'TIME':
          payload.timeSeconds =
            (optionalNumber(
              minutes,
            ) ??
              0) *
              60 +
            (optionalNumber(
              seconds,
            ) ??
              0);

          break;

        case 'ROUNDS_REPS':
          payload.rounds =
            optionalNumber(
              rounds,
            );

          payload.reps =
            optionalNumber(
              reps,
            );

          break;

        case 'REPS':
          payload.reps =
            optionalNumber(
              reps,
            );

          break;

        case 'LOAD':
          payload.load =
            optionalNumber(
              load,
            );

          payload.weightUnit =
            weightUnit;

          break;
      }

      const response =
        await fetch(
          `/api/workouts/${workoutId}/results`,
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

  function resetForm() {
    setWorkoutVariantId(
      defaultVariant?.id ?? '',
    );

    setPrescriptionCategoryKey(
      defaultPrescriptionCategoryKey,
    );

    setMinutes('');
    setSeconds('');
    setRounds('');
    setReps('');
    setLoad('');

    setWeightUnit(
      preferredWeightUnit,
    );

    setPerformedDate(
      getLocalDateValue(),
    );

    setPerformedTime(
      getLocalTimeValue(),
    );

    setNotes('');
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

        <h3 className="mt-1 text-xl font-bold">
          {
            localizedResultType
          }
        </h3>

        <p className="mt-1 text-sm text-muted">
          {t(
            'description',
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="workoutVariantId"
            className="mb-1.5 block text-sm font-medium"
          >
            {t(
              'workoutLevel',
            )}
          </label>

          <select
            id="workoutVariantId"
            value={
              workoutVariantId
            }
            onChange={(
              event,
            ) =>
              setWorkoutVariantId(
                event.target
                  .value,
              )
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          >
            <option value="">
              {t(
                'selectWorkoutLevel',
              )}
            </option>

            {variants.map(
              (variant) => (
                <option
                  key={
                    variant.id
                  }
                  value={
                    variant.id
                  }
                >
                  {
                    variant
                      .level.name
                  }
                  {variant.name
                    ? ` · ${variant.name}`
                    : ''}
                </option>
              ),
            )}
          </select>
        </div>

        {prescriptionCategories.length >
          0 && (
          <div>
            <label
              htmlFor="prescriptionCategory"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'prescriptionCategory',
              )}

              <span className="ml-1 font-normal text-muted">
                {t(
                  'optional',
                )}
              </span>
            </label>

            <select
              id="prescriptionCategory"
              value={
                prescriptionCategoryKey
              }
              onChange={(
                event,
              ) =>
                setPrescriptionCategoryKey(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="">
                {t(
                  'noPrescriptionCategory',
                )}
              </option>

              {prescriptionCategories.map(
                (
                  category,
                ) => (
                  <option
                    key={
                      category.key
                    }
                    value={
                      category.key
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        {resultType.key ===
          'TIME' && (
          <>
            <NumberField
              id="minutes"
              label={t(
                'minutes',
              )}
              value={
                minutes
              }
              onChange={
                setMinutes
              }
              placeholder="5"
            />

            <NumberField
              id="seconds"
              label={t(
                'seconds',
              )}
              value={
                seconds
              }
              onChange={
                setSeconds
              }
              placeholder="58"
              max={59}
            />
          </>
        )}

        {resultType.key ===
          'ROUNDS_REPS' && (
          <>
            <NumberField
              id="rounds"
              label={t(
                'rounds',
              )}
              value={
                rounds
              }
              onChange={
                setRounds
              }
              placeholder="7"
            />

            <NumberField
              id="reps"
              label={t(
                'extraReps',
              )}
              value={
                reps
              }
              onChange={
                setReps
              }
              placeholder="12"
            />
          </>
        )}

        {resultType.key ===
          'REPS' && (
          <div className="md:col-span-2">
            <NumberField
              id="reps"
              label={t(
                'reps',
              )}
              value={
                reps
              }
              onChange={
                setReps
              }
              placeholder="50"
            />
          </div>
        )}

        {resultType.key ===
          'LOAD' && (
          <>
            <NumberField
              id="load"
              label={t(
                'load',
              )}
              value={
                load
              }
              onChange={
                setLoad
              }
              placeholder="100"
              step="0.1"
            />

            <div>
              <label
                htmlFor="weightUnit"
                className="mb-1.5 block text-sm font-medium"
              >
                {t(
                  'unit',
                )}
              </label>

              <select
                id="weightUnit"
                value={
                  weightUnit
                }
                onChange={(
                  event,
                ) =>
                  setWeightUnit(
                    event.target
                      .value as
                      | 'KG'
                      | 'LB',
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

        <div className="md:col-span-2">
          <p className="mb-1.5 text-sm font-medium">
            {t(
              'performedAt',
            )}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                {t(
                  'date',
                )}
              </p>

              <button
                type="button"
                onClick={
                  openDatePicker
                }
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedDate(
                      performedDate,
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    {t(
                      'chooseDate',
                    )}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-lg text-muted"
                >
                  ◫
                </span>
              </button>

              <input
                ref={
                  dateInputRef
                }
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
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                {t(
                  'time',
                )}
              </p>

              <button
                type="button"
                onClick={
                  openTimePicker
                }
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedTime(
                      performedTime,
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    {t(
                      'chooseTime',
                    )}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-lg text-muted"
                >
                  ◷
                </span>
              </button>

              <input
                ref={
                  timeInputRef
                }
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
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-muted">
            {t(
              'performedAtHelp',
            )}
          </p>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="mb-1.5 block text-sm font-medium"
          >
            {t(
              'notes',
            )}

            <span className="ml-1 font-normal text-muted">
              {t(
                'optional',
              )}
            </span>
          </label>

          <textarea
            id="notes"
            rows={3}
            value={
              notes
            }
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
          className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
        >
          <p className="text-sm text-red-500">
            {error}
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !workoutVariantId
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