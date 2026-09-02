"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatShortDate } from "@/lib/date-formatters";
import type {
  MeasurementResultValues,
  MeasurementType,
} from "@/lib/result-types";

export type MovementProgressResult = MeasurementResultValues & {
  id: string;
  performedAt: string;
  measurementType: MeasurementType;
};

type Props = {
  measurementTypes: MeasurementType[];

  results: MovementProgressResult[];
};

type ChartPoint = {
  id: string;
  value: number;
  displayValue: string;
  performedAt: string;
};

const CHART_WIDTH = 700;
const CHART_HEIGHT = 240;

const PADDING_LEFT = 42;
const PADDING_RIGHT = 20;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 44;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function normalizeLoadToKg(
  load: number | string | null,
  weightUnit: "KG" | "LB" | null,
) {
  if (load === null) {
    return null;
  }

  const numericLoad = Number(load);

  if (Number.isNaN(numericLoad)) {
    return null;
  }

  if (weightUnit === "LB") {
    return numericLoad * 0.45359237;
  }

  return numericLoad;
}

export default function MovementProgressChart({
  measurementTypes,
  results,
}: Props) {
  const t = useTranslations("movements.detail.progress");

  const measurementT = useTranslations("measurementTypes");

  const locale = useLocale();

  const availableTypes = useMemo(
    () =>
      measurementTypes.filter((type) =>
        results.some((result) => result.measurementType.key === type.key),
      ),
    [measurementTypes, results],
  );

  const [selectedTypeKey, setSelectedTypeKey] = useState(
    availableTypes[0]?.key ?? measurementTypes[0]?.key ?? "",
  );

  const weightRepOptions = useMemo(() => {
    if (selectedTypeKey !== "WEIGHT") {
      return [];
    }

    return Array.from(
      new Set(
        results
          .filter(
            (result) =>
              result.measurementType.key === "WEIGHT" &&
              result.reps !== null &&
              result.load !== null,
          )
          .map((result) => result.reps as number),
      ),
    ).sort((a, b) => a - b);
  }, [results, selectedTypeKey]);

  const [selectedReps, setSelectedReps] = useState<number | null>(
    weightRepOptions[0] ?? null,
  );

  const effectiveSelectedReps =
    selectedTypeKey === "WEIGHT" &&
    selectedReps !== null &&
    weightRepOptions.includes(selectedReps)
      ? selectedReps
      : (weightRepOptions[0] ?? null);

  function getMeasurementName(type: { key: string; name: string }) {
    const key = type.key.toLowerCase();

    return measurementT.has(key) ? measurementT(key) : type.name;
  }

  function formatDateShort(value: string) {
    return formatShortDate(value, locale);
  }

  function getChartPoints(): ChartPoint[] {
    const matchingResults = results
      .filter((result) => result.measurementType.key === selectedTypeKey)
      .filter(
        (result) =>
          selectedTypeKey !== "WEIGHT" ||
          effectiveSelectedReps === null ||
          result.reps === effectiveSelectedReps,
      )
      .sort(
        (a, b) =>
          new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
      );

    switch (selectedTypeKey) {
      case "WEIGHT":
        return matchingResults
          .map((result) => {
            const normalized = normalizeLoadToKg(
              result.load,
              result.weightUnit,
            );

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
        return matchingResults
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
        return matchingResults
          .filter((result) => result.distance !== null)
          .map((result) => ({
            id: result.id,

            value: result.distance as number,

            displayValue: `${result.distance} m`,

            performedAt: result.performedAt,
          }));

      case "DURATION":
        return matchingResults
          .filter((result) => result.durationSeconds !== null)
          .map((result) => ({
            id: result.id,

            value: result.durationSeconds as number,

            displayValue: formatDuration(result.durationSeconds as number),

            performedAt: result.performedAt,
          }));

      case "CALORIES":
        return matchingResults
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

  const lowerIsBetter = selectedTypeKey === "DURATION";

  function renderChart() {
    if (points.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm font-medium">{t("noData")}</p>

          <p className="mt-1 text-xs text-muted">{t("noDataDescription")}</p>
        </div>
      );
    }

    if (points.length === 1) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-2xl font-black text-accent">
            {points[0].displayValue}
          </p>

          <p className="mt-2 text-xs text-muted">{t("logAnotherResult")}</p>
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

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <p className="font-semibold">{t("emptyTitle")}</p>

        <p className="mt-1 text-sm text-muted">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {availableTypes.length > 1 && (
          <div>
            <label
              htmlFor="progressMeasurementType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("measurementType")}
            </label>

            <select
              id="progressMeasurementType"
              value={selectedTypeKey}
              onChange={(event) => {
                setSelectedTypeKey(event.target.value);

                setSelectedReps(null);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              {availableTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {getMeasurementName(type)}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedTypeKey === "WEIGHT" && weightRepOptions.length > 0 && (
          <div>
            <label
              htmlFor="progressRepScheme"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t("repScheme")}
            </label>

            <select
              id="progressRepScheme"
              value={effectiveSelectedReps ?? ""}
              onChange={(event) => setSelectedReps(Number(event.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              {weightRepOptions.map((reps) => (
                <option key={reps} value={reps}>
                  {reps}
                  RM
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {renderChart()}
    </div>
  );
}
