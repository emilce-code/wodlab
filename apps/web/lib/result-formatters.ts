import type {
  MeasurementResultValues,
  PerformedMovement,
  WeightUnit,
} from './result-types';

export const EMPTY_RESULT_VALUE = '—';

type WorkoutResultValues = {
  resultType: {
    key: string;
  };

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;
};

type FormatWorkoutResultOptions = {
  formatReps?: (reps: number) => string;
};

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const hours = Math.floor(
    safeSeconds / 3600,
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );

  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatWeight(
  load: number,
  weightUnit: WeightUnit | null,
): string {
  return `${load}${
    weightUnit
      ? ` ${weightUnit}`
      : ''
  }`;
}

export function formatWorkoutResult(
  result: WorkoutResultValues,
  options: FormatWorkoutResultOptions = {},
): string {
  const {
    formatReps = (reps) => String(reps),
  } = options;

  switch (result.resultType.key) {
    case 'TIME':
      return result.timeSeconds !== null
        ? formatDuration(
            result.timeSeconds,
          )
        : EMPTY_RESULT_VALUE;

    case 'ROUNDS_REPS':
      return `${result.rounds ?? 0} + ${
        result.reps ?? 0
      }`;

    case 'REPS':
      return result.reps !== null
        ? formatReps(result.reps)
        : EMPTY_RESULT_VALUE;

    case 'LOAD':
      return result.load !== null
        ? formatWeight(
            result.load,
            result.weightUnit,
          )
        : EMPTY_RESULT_VALUE;

    default:
      return EMPTY_RESULT_VALUE;
  }
}

export function formatMeasurementResult(
  measurementTypeKey: string,
  result: MeasurementResultValues,
  options: FormatWorkoutResultOptions = {},
): string {
  const {
    formatReps = (reps) => String(reps),
  } = options;

  switch (measurementTypeKey) {
    case 'WEIGHT': {
      if (result.load === null) {
        return EMPTY_RESULT_VALUE;
      }

      const load = formatWeight(
        result.load,
        result.weightUnit,
      );

      return result.reps !== null
        ? `${result.reps} × ${load}`
        : load;
    }

    case 'REPS':
      return result.reps !== null
        ? formatReps(result.reps)
        : EMPTY_RESULT_VALUE;

    case 'DISTANCE':
      return result.distance !== null
        ? `${result.distance} m`
        : EMPTY_RESULT_VALUE;

    case 'DURATION':
      return result.durationSeconds !== null
        ? formatDuration(
            result.durationSeconds,
          )
        : EMPTY_RESULT_VALUE;

    case 'CALORIES':
      return result.calories !== null
        ? `${result.calories} cal`
        : EMPTY_RESULT_VALUE;

    default:
      return EMPTY_RESULT_VALUE;
  }
}

export function formatPerformedMovement(
  movement: Pick<
    PerformedMovement,
    | 'reps'
    | 'load'
    | 'weightUnit'
    | 'distance'
    | 'durationSeconds'
    | 'calories'
  >,
  options: FormatWorkoutResultOptions = {},
): string {
  const {
    formatReps = (reps) => String(reps),
  } = options;

  const values: string[] = [];

  if (movement.reps !== null) {
    values.push(
      formatReps(movement.reps),
    );
  }

  if (movement.load !== null) {
    values.push(
      formatWeight(
        movement.load,
        movement.weightUnit,
      ),
    );
  }

  if (movement.distance !== null) {
    values.push(
      `${movement.distance} m`,
    );
  }

  if (
    movement.durationSeconds !== null
  ) {
    values.push(
      formatDuration(
        movement.durationSeconds,
      ),
    );
  }

  if (movement.calories !== null) {
    values.push(
      `${movement.calories} cal`,
    );
  }

  return values.join(' · ');
}

export function formatDate(
  value: string | Date,
  locale: string,
): string {
  return new Intl.DateTimeFormat(
    locale,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(new Date(value));
}

export function formatTime(
  value: string | Date,
  locale: string,
): string {
  return new Intl.DateTimeFormat(
    locale,
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(new Date(value));
}