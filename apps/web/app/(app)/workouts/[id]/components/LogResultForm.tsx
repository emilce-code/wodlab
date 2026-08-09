'use client';

import {
  FormEvent,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type ResultType = {
  key: string;
  name: string;
};

type Props = {
  workoutId: string;
  resultType: ResultType;
  preferredWeightUnit?: 'KG' | 'LB';
};

function getLocalDateValue() {
  const now = new Date();

  const year = now.getFullYear();
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

function formatSelectedDate(
  value: string,
) {
  if (!value) {
    return 'Select date';
  }

  const [year, month, day] =
    value.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
  );

  return new Intl.DateTimeFormat(
    'en-US',
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
    return 'Select time';
  }

  const [hours, minutes] =
    value.split(':').map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return new Intl.DateTimeFormat(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(date);
}

export default function LogResultForm({
  workoutId,
  resultType,
  preferredWeightUnit = 'KG',
}: Props) {
  const router = useRouter();

  const dateInputRef =
    useRef<HTMLInputElement>(null);

  const timeInputRef =
    useRef<HTMLInputElement>(null);

  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const [rounds, setRounds] = useState('');
  const [reps, setReps] = useState('');

  const [load, setLoad] = useState('');
  const [weightUnit, setWeightUnit] =
    useState<'KG' | 'LB'>(
      preferredWeightUnit,
    );

  const [isRx, setIsRx] = useState(false);

  const [
    performedDate,
    setPerformedDate,
  ] = useState(getLocalDateValue);

  const [
    performedTime,
    setPerformedTime,
  ] = useState(getLocalTimeValue);

  const [notes, setNotes] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function optionalNumber(
    value: string,
  ): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    return Number(value);
  }

  function validate(): string | null {
    switch (resultType.key) {
      case 'TIME': {
        const minuteValue =
          optionalNumber(minutes) ?? 0;

        const secondValue =
          optionalNumber(seconds) ?? 0;

        if (
          minuteValue === 0 &&
          secondValue === 0
        ) {
          return 'Enter a workout time.';
        }

        if (
          secondValue < 0 ||
          secondValue > 59
        ) {
          return 'Seconds must be between 0 and 59.';
        }

        break;
      }

      case 'ROUNDS_REPS': {
        if (
          !rounds.trim() &&
          !reps.trim()
        ) {
          return 'Enter rounds or reps.';
        }

        break;
      }

      case 'REPS': {
        if (!reps.trim()) {
          return 'Enter the number of reps.';
        }

        break;
      }

      case 'LOAD': {
        if (!load.trim()) {
          return 'Enter the load.';
        }

        break;
      }
    }

    if (
      !performedDate ||
      !performedTime
    ) {
      return 'Select when the workout was performed.';
    }

    return null;
  }

  function getPerformedAtIso() {
    const localDateTime =
      `${performedDate}T${performedTime}`;

    return new Date(
      localDateTime,
    ).toISOString();
  }

  function openDatePicker() {
    const input =
      dateInputRef.current;

    if (!input) {
      return;
    }

    if ('showPicker' in input) {
      input.showPicker();
      return;
    }

    input.click();
  }

  function openTimePicker() {
    const input =
      timeInputRef.current;

    if (!input) {
      return;
    }

    if ('showPicker' in input) {
      input.showPicker();
      return;
    }

    input.click();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        performedAt: string;
        timeSeconds?: number;
        rounds?: number;
        reps?: number;
        load?: number;
        weightUnit?: 'KG' | 'LB';
        isRx: boolean;
        notes?: string;
      } = {
        performedAt:
          getPerformedAtIso(),
        isRx,
      };

      if (notes.trim()) {
        payload.notes =
          notes.trim();
      }

      switch (resultType.key) {
        case 'TIME': {
          const totalSeconds =
            (optionalNumber(minutes) ??
              0) *
              60 +
            (optionalNumber(seconds) ??
              0);

          payload.timeSeconds =
            totalSeconds;

          break;
        }

        case 'ROUNDS_REPS': {
          payload.rounds =
            optionalNumber(rounds);

          payload.reps =
            optionalNumber(reps);

          break;
        }

        case 'REPS': {
          payload.reps =
            optionalNumber(reps);

          break;
        }

        case 'LOAD': {
          payload.load =
            optionalNumber(load);

          payload.weightUnit =
            weightUnit;

          break;
        }
      }

      const response = await fetch(
        `/api/workouts/${workoutId}/results`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            payload,
          ),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
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
            'Unable to save result.',
        );

        return;
      }

      resetForm();

      router.refresh();
    } catch {
      setError(
        'Unable to save result. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setMinutes('');
    setSeconds('');
    setRounds('');
    setReps('');
    setLoad('');
    setIsRx(false);

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
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Log result
        </p>

        <h3 className="mt-1 text-xl font-bold">
          {resultType.name}
        </h3>

        <p className="mt-1 text-sm text-muted">
          Record your performance for
          this workout.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {resultType.key ===
          'TIME' && (
          <>
            <div>
              <label
                htmlFor="minutes"
                className="mb-1.5 block text-sm font-medium"
              >
                Minutes
              </label>

              <input
                id="minutes"
                type="number"
                min="0"
                value={minutes}
                onChange={(event) =>
                  setMinutes(
                    event.target
                      .value,
                  )
                }
                placeholder="5"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="seconds"
                className="mb-1.5 block text-sm font-medium"
              >
                Seconds
              </label>

              <input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(event) =>
                  setSeconds(
                    event.target
                      .value,
                  )
                }
                placeholder="58"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </>
        )}

        {resultType.key ===
          'ROUNDS_REPS' && (
          <>
            <div>
              <label
                htmlFor="rounds"
                className="mb-1.5 block text-sm font-medium"
              >
                Rounds
              </label>

              <input
                id="rounds"
                type="number"
                min="0"
                value={rounds}
                onChange={(event) =>
                  setRounds(
                    event.target
                      .value,
                  )
                }
                placeholder="7"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="reps"
                className="mb-1.5 block text-sm font-medium"
              >
                Extra reps
              </label>

              <input
                id="reps"
                type="number"
                min="0"
                value={reps}
                onChange={(event) =>
                  setReps(
                    event.target
                      .value,
                  )
                }
                placeholder="12"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </>
        )}

        {resultType.key ===
          'REPS' && (
          <div className="md:col-span-2">
            <label
              htmlFor="reps"
              className="mb-1.5 block text-sm font-medium"
            >
              Reps
            </label>

            <input
              id="reps"
              type="number"
              min="0"
              value={reps}
              onChange={(event) =>
                setReps(
                  event.target
                    .value,
                )
              }
              placeholder="50"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>
        )}

        {resultType.key ===
          'LOAD' && (
          <>
            <div>
              <label
                htmlFor="load"
                className="mb-1.5 block text-sm font-medium"
              >
                Load
              </label>

              <input
                id="load"
                type="number"
                min="0"
                step="0.1"
                value={load}
                onChange={(event) =>
                  setLoad(
                    event.target
                      .value,
                  )
                }
                placeholder="100"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="weightUnit"
                className="mb-1.5 block text-sm font-medium"
              >
                Unit
              </label>

              <select
                id="weightUnit"
                value={weightUnit}
                onChange={(event) =>
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
            Performed at
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Date
              </p>

              <button
                type="button"
                onClick={openDatePicker}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedDate(
                      performedDate,
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    Choose date
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
                ref={dateInputRef}
                type="date"
                value={performedDate}
                onChange={(event) =>
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
                Time
              </p>

              <button
                type="button"
                onClick={openTimePicker}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {formatSelectedTime(
                      performedTime,
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    Choose time
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
                ref={timeInputRef}
                type="time"
                value={performedTime}
                onChange={(event) =>
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
            Defaults to now. Change it
            only when logging a previous
            workout.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={isRx}
              onChange={(event) =>
                setIsRx(
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4 rounded border-border accent-[var(--accent)]"
            />

            <div>
              <p className="text-sm font-medium">
                Rx
              </p>

              <p className="mt-0.5 text-xs text-muted">
                Completed as prescribed.
              </p>
            </div>
          </label>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="mb-1.5 block text-sm font-medium"
          >
            Notes
            <span className="ml-1 font-normal text-muted">
              (optional)
            </span>
          </label>

          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value,
              )
            }
            placeholder="How did it feel? Scaling, pacing, anything worth remembering..."
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
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting
            ? 'Saving result...'
            : 'Save result'}
        </button>
      </div>
    </form>
  );
}