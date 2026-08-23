'use client';

import {
  useLocale,
  useTranslations,
} from 'next-intl';

type ResultType = {
  key: string;
  name: string;
};

export type TrendResult = {
  id: string;
  performedAt: string;

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;

  workoutVariant: {
    id: string;
    name: string | null;

    level: {
      key: string;
      name: string;
    };
  } | null;

  prescriptionCategory: {
    key: string;
    name: string;
  } | null;

  notes: string | null;

  resultType: ResultType;
};

type Props = {
  resultType: ResultType;
  history: TrendResult[];
};

type ChartPoint = {
  id: string;
  value: number;
  displayValue: string;
  performedAt: string;
};

const CHART_WIDTH = 700;
const CHART_HEIGHT = 220;

const PADDING_LEFT = 42;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 42;

function formatDuration(
  seconds: number,
) {
  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function normalizeLoadToKg(
  result: TrendResult,
) {
  if (result.load === null) {
    return null;
  }

  if (
    result.weightUnit === 'LB'
  ) {
    return (
      result.load *
      0.45359237
    );
  }

  return result.load;
}

export default function WorkoutTrendChart({
  resultType,
  history,
}: Props) {
  const t =
    useTranslations(
      'progress.chart',
    );

  const locale =
    useLocale();

  function formatDateShort(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      locale,
      {
        month: 'short',
        day: 'numeric',
      },
    ).format(new Date(value));
  }

  function getChartPoints(): ChartPoint[] {
    switch (resultType.key) {
      case 'TIME':
        return history
          .filter(
            (result) =>
              result.timeSeconds !==
              null,
          )
          .map((result) => ({
            id: result.id,

            value:
              result.timeSeconds as number,

            displayValue:
              formatDuration(
                result.timeSeconds as number,
              ),

            performedAt:
              result.performedAt,
          }));

      case 'REPS':
        return history
          .filter(
            (result) =>
              result.reps !==
              null,
          )
          .map((result) => ({
            id: result.id,

            value:
              result.reps as number,

            displayValue: t(
              'repsValue',
              {
                count:
                  result.reps as number,
              },
            ),

            performedAt:
              result.performedAt,
          }));

      case 'LOAD':
        return history
          .map((result) => {
            const normalized =
              normalizeLoadToKg(
                result,
              );

            if (
              normalized === null
            ) {
              return null;
            }

            return {
              id: result.id,

              value:
                normalized,

              displayValue: `${
                result.load
              } ${
                result.weightUnit ??
                ''
              }`.trim(),

              performedAt:
                result.performedAt,
            };
          })
          .filter(
            (
              point,
            ): point is ChartPoint =>
              point !== null,
          );

      default:
        return [];
    }
  }

  function LineTrendChart({
    points,
    lowerIsBetter,
  }: {
    points: ChartPoint[];
    lowerIsBetter: boolean;
  }) {
    if (
      points.length === 0
    ) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {t('notEnoughData')}
        </div>
      );
    }

    if (
      points.length === 1
    ) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="font-semibold">
            {
              points[0]
                .displayValue
            }
          </p>

          <p className="mt-1 text-xs text-muted">
            {t(
              'logAnotherResult',
            )}
          </p>
        </div>
      );
    }

    const values =
      points.map(
        (point) =>
          point.value,
      );

    let minValue =
      Math.min(...values);

    let maxValue =
      Math.max(...values);

    if (
      minValue === maxValue
    ) {
      minValue -= 1;
      maxValue += 1;
    }

    const valuePadding =
      (maxValue -
        minValue) *
      0.12;

    minValue -=
      valuePadding;

    maxValue +=
      valuePadding;

    const plotWidth =
      CHART_WIDTH -
      PADDING_LEFT -
      PADDING_RIGHT;

    const plotHeight =
      CHART_HEIGHT -
      PADDING_TOP -
      PADDING_BOTTOM;

    function getX(
      index: number,
    ) {
      return (
        PADDING_LEFT +
        (index /
          (points.length -
            1)) *
          plotWidth
      );
    }

    function getY(
      value: number,
    ) {
      const ratio =
        (value -
          minValue) /
        (maxValue -
          minValue);

      return (
        PADDING_TOP +
        plotHeight -
        ratio *
          plotHeight
      );
    }

    const linePoints =
      points
        .map(
          (
            point,
            index,
          ) =>
            `${getX(
              index,
            )},${getY(
              point.value,
            )}`,
        )
        .join(' ');

    const bestValue =
      lowerIsBetter
        ? Math.min(
            ...values,
          )
        : Math.max(
            ...values,
          );

    return (
      <div>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={t(
              'ariaLabel',
            )}
            className="w-full min-w-[560px]"
          >
            <line
              x1={
                PADDING_LEFT
              }
              y1={
                CHART_HEIGHT -
                PADDING_BOTTOM
              }
              x2={
                CHART_WIDTH -
                PADDING_RIGHT
              }
              y2={
                CHART_HEIGHT -
                PADDING_BOTTOM
              }
              stroke="currentColor"
              strokeOpacity="0.15"
            />

            <line
              x1={
                PADDING_LEFT
              }
              y1={
                PADDING_TOP
              }
              x2={
                PADDING_LEFT
              }
              y2={
                CHART_HEIGHT -
                PADDING_BOTTOM
              }
              stroke="currentColor"
              strokeOpacity="0.15"
            />

            <polyline
              points={
                linePoints
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="text-accent"
            />

            {points.map(
              (
                point,
                index,
              ) => {
                const x =
                  getX(index);

                const y =
                  getY(
                    point.value,
                  );

                const isBest =
                  point.value ===
                  bestValue;

                return (
                  <g
                    key={
                      point.id
                    }
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={
                        isBest
                          ? 6
                          : 4
                      }
                      fill="currentColor"
                      className={
                        isBest
                          ? 'text-accent'
                          : 'text-foreground'
                      }
                    />

                    <text
                      x={x}
                      y={
                        y - 12
                      }
                      textAnchor="middle"
                      fontSize="11"
                      fill="currentColor"
                      className={
                        isBest
                          ? 'text-accent'
                          : 'text-muted'
                      }
                    >
                      {
                        point.displayValue
                      }
                    </text>

                    <text
                      x={x}
                      y={
                        CHART_HEIGHT -
                        14
                      }
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                      className="text-muted"
                    >
                      {formatDateShort(
                        point.performedAt,
                      )}
                    </text>
                  </g>
                );
              },
            )}
          </svg>
        </div>

        <p className="mt-2 text-xs text-muted">
          {lowerIsBetter
            ? t(
                'lowerIsBetter',
              )
            : t(
                'higherIsBetter',
              )}
        </p>
      </div>
    );
  }

  function RoundsRepsTimeline() {
    if (
      history.length === 0
    ) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {t(
            'noAttempts',
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-start gap-3 pb-2">
          {history.map(
            (
              result,
              index,
            ) => (
              <div
                key={
                  result.id
                }
                className="flex items-center"
              >
                <div className="min-w-28 rounded-lg border border-border bg-background px-3 py-3 text-center">
                  <p className="text-lg font-black">
                    {result.rounds ??
                      0}
                    {' + '}
                    {result.reps ??
                      0}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {formatDateShort(
                      result.performedAt,
                    )}
                  </p>

                  {(result.workoutVariant ||
                    result.prescriptionCategory) && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {result.workoutVariant && (
                        <span
                          className={
                            result
                              .workoutVariant
                              .level.key ===
                            'RX'
                              ? 'rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent'
                              : 'rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted'
                          }
                        >
                          {
                            result
                              .workoutVariant
                              .level.name
                          }
                        </span>
                      )}

                      {result.prescriptionCategory && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {
                            result
                              .prescriptionCategory
                              .name
                          }
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {index <
                  history.length -
                    1 && (
                  <div className="mx-2 h-px w-6 bg-border" />
                )}
              </div>
            ),
          )}
        </div>

        <p className="mt-2 text-xs text-muted">
          {t(
            'roundsRepsExplanation',
          )}
        </p>
      </div>
    );
  }

  if (
    resultType.key ===
    'ROUNDS_REPS'
  ) {
    return (
      <RoundsRepsTimeline />
    );
  }

  const points =
    getChartPoints();

  return (
    <LineTrendChart
      points={points}
      lowerIsBetter={
        resultType.key ===
        'TIME'
      }
    />
  );
}