"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatShortDate } from "@/lib/date-formatters";
import type {
  MeasurementResultValues,
  MeasurementType,
} from "@/lib/result-types";

export type MovementTrendResult = MeasurementResultValues & {
  id: string;
  performedAt: string;
};

type Props = {
  measurementType: MeasurementType;

  reps: number | null;

  history: MovementTrendResult[];
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function normalizeLoadToKg(result: MovementTrendResult) {
  if (result.load === null) {
    return null;
  }

  const load = Number(result.load);

  if (Number.isNaN(load)) {
    return null;
  }

  if (result.weightUnit === "LB") {
    return load * 0.45359237;
  }

  return load;
}

export default function MovementTrendChart({
  measurementType,
  history,
}: Props) {
  const t = useTranslations("progress.movementChart");

  const locale = useLocale();

  function formatDateShort(value: string) {
    return formatShortDate(value, locale);
  }

  function getChartPoints(): ChartPoint[] {
    const chronological = [...history].sort(
      (a, b) =>
        new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );

    switch (measurementType.key) {
      case "WEIGHT":
        return chronological
          .map((result) => {
            const normalized = normalizeLoadToKg(result);

            if (normalized === null) {
              return null;
            }

            return {
              id: result.id,

              value: normalized,

              displayValue: `${result.load} ${result.weightUnit ?? ""}`.trim(),

              performedAt: result.performedAt,
            };
          })
          .filter((point): point is ChartPoint => point !== null);

      case "REPS":
        return chronological
          .filter((result) => result.reps !== null)
          .map((result) => ({
            id: result.id,

            value: result.reps as number,

            displayValue: t("repsValue", {
              count: result.reps as number,
            }),

            performedAt: result.performedAt,
          }));

      case "DISTANCE":
        return chronological
          .filter((result) => result.distance !== null)
          .map((result) => ({
            id: result.id,

            value: result.distance as number,

            displayValue: `${result.distance} m`,

            performedAt: result.performedAt,
          }));

      case "DURATION":
        return chronological
          .filter((result) => result.durationSeconds !== null)
          .map((result) => ({
            id: result.id,

            value: result.durationSeconds as number,

            displayValue: formatDuration(result.durationSeconds as number),

            performedAt: result.performedAt,
          }));

      case "CALORIES":
        return chronological
          .filter((result) => result.calories !== null)
          .map((result) => ({
            id: result.id,

            value: result.calories as number,

            displayValue: `${result.calories} cal`,

            performedAt: result.performedAt,
          }));

      default:
        return [];
    }
  }

  const points = getChartPoints();

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        {t("notEnoughData")}
      </div>
    );
  }

  if (points.length === 1) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="font-semibold">{points[0].displayValue}</p>

        <p className="mt-1 text-xs text-muted">{t("logAnotherResult")}</p>
      </div>
    );
  }

  const values = points.map((point) => point.value);

  let minValue = Math.min(...values);

  let maxValue = Math.max(...values);

  if (minValue === maxValue) {
    minValue -= 1;
    maxValue += 1;
  }

  const valuePadding = (maxValue - minValue) * 0.12;

  minValue -= valuePadding;

  maxValue += valuePadding;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;

  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function getX(index: number) {
    return PADDING_LEFT + (index / (points.length - 1)) * plotWidth;
  }

  function getY(value: number) {
    const ratio = (value - minValue) / (maxValue - minValue);

    return PADDING_TOP + plotHeight - ratio * plotHeight;
  }

  const linePoints = points
    .map((point, index) => `${getX(index)},${getY(point.value)}`)
    .join(" ");

  const lowerIsBetter = measurementType.key === "DURATION";

  const bestValue = lowerIsBetter ? Math.min(...values) : Math.max(...values);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={t("ariaLabel")}
          className="w-full min-w-[560px]"
        >
          <line
            x1={PADDING_LEFT}
            y1={CHART_HEIGHT - PADDING_BOTTOM}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <line
            x1={PADDING_LEFT}
            y1={PADDING_TOP}
            x2={PADDING_LEFT}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-accent"
          />

          {points.map((point, index) => {
            const x = getX(index);

            const y = getY(point.value);

            const isBest = point.value === bestValue;

            return (
              <g key={point.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isBest ? 6 : 4}
                  fill="currentColor"
                  className={isBest ? "text-accent" : "text-foreground"}
                />

                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className={isBest ? "text-accent" : "text-muted"}
                >
                  {point.displayValue}
                </text>

                <text
                  x={x}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted"
                >
                  {formatDateShort(point.performedAt)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-xs text-muted">
        {lowerIsBetter ? t("lowerIsBetter") : t("higherIsBetter")}
      </p>
    </div>
  );
}
