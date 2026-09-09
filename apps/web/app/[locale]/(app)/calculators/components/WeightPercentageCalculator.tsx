"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { WeightUnit } from "@/lib/result-types";
import {
  calculatePercentage,
  convertWeight,
  roundToIncrement,
} from "@/lib/training-calculators";

const presets = [40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100];

function availablePlates(unit: WeightUnit) {
  return unit === "KG"
    ? [25, 20, 15, 10, 5, 2.5, 1.25]
    : [55, 45, 35, 25, 10, 5, 2.5];
}

export default function WeightPercentageCalculator({
  preferredUnit,
}: {
  preferredUnit: WeightUnit;
}) {
  const t = useTranslations("calculators");
  const [unit, setUnit] = useState<WeightUnit>(preferredUnit);
  const [reference, setReference] = useState("100");
  const [percentage, setPercentage] = useState("75");
  const [mode, setMode] = useState<"target" | "reverse">("target");
  const [performedWeight, setPerformedWeight] = useState("75");
  const [increment, setIncrement] = useState(
    preferredUnit === "KG" ? "0.5" : "1",
  );
  const [barWeight, setBarWeight] = useState(
    preferredUnit === "KG" ? "20" : "45",
  );
  const referenceValue = Number(reference) || 0;
  const percentageValue = Number(percentage) || 0;
  const target = roundToIncrement(
    calculatePercentage(referenceValue, percentageValue),
    Number(increment) || 0.5,
  );
  const reversePercentage =
    referenceValue > 0
      ? ((Number(performedWeight) || 0) / referenceValue) * 100
      : 0;
  const hasReference = referenceValue > 0;
  const hasPercentage = percentageValue > 0;
  const validTarget = hasReference && hasPercentage;
  const perSide = Math.max(0, (target - (Number(barWeight) || 0)) / 2);
  let remaining = perSide;
  const plates: number[] = [];
  for (const plate of availablePlates(unit)) {
    while (remaining + 0.001 >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }

  function changeUnit(next: WeightUnit) {
    if (next === unit) return;
    setReference(
      String(Math.round(convertWeight(referenceValue, unit, next) * 10) / 10),
    );
    setPerformedWeight(
      String(
        Math.round(
          convertWeight(Number(performedWeight) || 0, unit, next) * 10,
        ) / 10,
      ),
    );
    setBarWeight(next === "KG" ? "20" : "45");
    setIncrement(next === "KG" ? "0.5" : "1");
    setUnit(next);
  }

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
      <Card className="min-w-0 p-4 sm:p-6">
        <div
          className="mb-5 grid grid-cols-2 rounded-xl bg-surface-elevated p-1"
          role="group"
          aria-label={t("mode")}
        >
          <Button
            type="button"
            variant={mode === "target" ? "primary" : "ghost"}
            onClick={() => setMode("target")}
          >
            {t("targetMode")}
          </Button>
          <Button
            type="button"
            variant={mode === "reverse" ? "primary" : "ghost"}
            onClick={() => setMode("reverse")}
          >
            {t("reverseMode")}
          </Button>
        </div>
        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2">
          <legend className="sr-only">{t("inputs")}</legend>
          <label className="text-sm font-semibold">
            {t("referenceWeight")}
            <input
              type="number"
              min="0"
              step="0.5"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4 text-lg"
            />
          </label>
          <div>
            <span className="text-sm font-semibold">{t("unit")}</span>
            <div className="mt-2 grid grid-cols-2 rounded-lg border border-border p-1">
              {(["KG", "LB"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={unit === value}
                  onClick={() => changeUnit(value)}
                  className={[
                    "min-h-10 rounded-md text-sm font-bold transition",
                    unit === value
                      ? "bg-foreground text-background"
                      : "text-muted hover:bg-surface-elevated hover:text-foreground",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {mode === "target" ? (
            <label className="text-sm font-semibold">
              {t("customPercentage")}
              <input
                type="number"
                min="1"
                max="200"
                step="0.5"
                value={percentage}
                onChange={(event) => setPercentage(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4 text-lg"
              />
            </label>
          ) : (
            <label className="text-sm font-semibold">
              {t("performedWeight")}
              <input
                type="number"
                min="0"
                step="0.5"
                value={performedWeight}
                onChange={(event) => setPerformedWeight(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4 text-lg"
              />
            </label>
          )}
          {mode === "target" ? (
            <label className="text-sm font-semibold">
              {t("rounding")}
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={increment}
                onChange={(event) => setIncrement(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4"
              />
            </label>
          ) : null}
        </fieldset>
        {mode === "target" ? (
          <div className="mt-5 flex flex-wrap gap-2" aria-label={t("presets")}>
            {presets.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={percentageValue === value ? "primary" : "secondary"}
                onClick={() => setPercentage(String(value))}
              >
                {value}%
              </Button>
            ))}
          </div>
        ) : null}
        {mode === "target" ? (
          <>
            <div className="mt-6 hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="py-3">{t("percentage")}</th>
                    <th className="py-3">{t("calculatedWeight")}</th>
                  </tr>
                </thead>
                <tbody>
                  {presets.map((value) => (
                    <tr key={value} className="border-b border-border/60">
                      <td className="py-3 font-semibold">{value}%</td>
                      <td className="py-3">
                        {roundToIncrement(
                          calculatePercentage(referenceValue, value),
                          Number(increment) || 0.5,
                        )}{" "}
                        {unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:hidden">
              {presets.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPercentage(String(value))}
                  className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <span className="font-semibold">{value}%</span>
                  <span className="text-muted">
                    {roundToIncrement(
                      calculatePercentage(referenceValue, value),
                      Number(increment) || 0.5,
                    )}{" "}
                    {unit}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </Card>
      <aside className="order-first space-y-6 lg:order-none lg:sticky lg:top-6">
        <Card className="overflow-hidden border-accent/40">
          <div
            className="bg-accent/10 p-4 text-center sm:p-8"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-muted">
              {mode === "target"
                ? t("targetWeight")
                : t("calculatedPercentage")}
            </p>
            <p className="mt-2 text-5xl font-black text-accent">
              {mode === "target"
                ? validTarget
                  ? target
                  : "—"
                : hasReference
                  ? Math.round(reversePercentage * 10) / 10
                  : "—"}
            </p>
            <p className="mt-1 font-semibold">
              {mode === "target" ? unit : "%"}
            </p>
            <p className="mt-3 break-words text-sm text-muted">
              {mode === "target"
                ? `${percentageValue}% × ${referenceValue} ${unit}`
                : `${Number(performedWeight) || 0} ${unit} ÷ ${referenceValue} ${unit}`}
            </p>
          </div>
        </Card>
        {mode === "target" ? (
          <Card className="p-5">
            <h2 className="text-lg font-bold">{t("plateLoading")}</h2>
            <label className="mt-4 block text-sm font-semibold">
              {t("barWeight")}
              <input
                type="number"
                min="0"
                step="0.5"
                value={barWeight}
                onChange={(event) => setBarWeight(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <p className="mt-4 text-sm text-muted">{t("platesPerSide")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {target < Number(barWeight) ? (
                <p className="text-sm text-muted">{t("belowBar")}</p>
              ) : plates.length > 0 ? (
                plates.map((plate, index) => (
                  <span
                    key={`${plate}-${index}`}
                    className="inline-flex min-h-10 items-center rounded-full border-2 border-accent/50 bg-accent/10 px-3 text-sm font-bold"
                  >
                    {plate} {unit}
                  </span>
                ))
              ) : (
                <p className="text-sm font-semibold">{t("noPlates")}</p>
              )}
            </div>
            {remaining > 0.01 ? (
              <p className="mt-2 text-sm text-amber-500">
                {t("remainder", {
                  value: Math.round(remaining * 100) / 100,
                  unit,
                })}
              </p>
            ) : null}
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
