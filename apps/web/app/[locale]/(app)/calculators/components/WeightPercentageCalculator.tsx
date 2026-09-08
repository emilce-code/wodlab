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
    setBarWeight(next === "KG" ? "20" : "45");
    setIncrement(next === "KG" ? "0.5" : "1");
    setUnit(next);
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
      <Card className="p-5 sm:p-6">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <label className="text-sm font-semibold">
            {t("unit")}
            <select
              value={unit}
              onChange={(event) => changeUnit(event.target.value as WeightUnit)}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4"
            >
              <option value="KG">KG</option>
              <option value="LB">LB</option>
            </select>
          </label>
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
        </div>
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
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
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
        ) : null}
      </Card>
      <div className="space-y-6">
        <Card className="border-accent/40 p-6 text-center">
          <p className="text-sm font-semibold text-muted">
            {mode === "target" ? t("targetWeight") : t("calculatedPercentage")}
          </p>
          <p className="mt-2 text-5xl font-black text-accent">
            {mode === "target"
              ? target
              : Math.round(reversePercentage * 10) / 10}
          </p>
          <p className="mt-1 font-semibold">{mode === "target" ? unit : "%"}</p>
          <p className="mt-3 text-sm text-muted">
            {mode === "target"
              ? `${percentageValue}% × ${referenceValue} ${unit}`
              : `${Number(performedWeight) || 0} ${unit} ÷ ${referenceValue} ${unit}`}
          </p>
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
            <p className="mt-2 text-lg font-bold">
              {target < Number(barWeight)
                ? t("belowBar")
                : plates.length > 0
                  ? plates.map((plate) => `${plate} ${unit}`).join(" + ")
                  : t("noPlates")}
            </p>
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
      </div>
    </div>
  );
}
