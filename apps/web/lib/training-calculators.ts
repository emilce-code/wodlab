import type { WeightUnit } from "./result-types";

export type PercentageTarget = {
  prescriptionId: string;
  percentage: number;
  referenceRepMax: number;
  movement: { id: string; name: string } | null;
  repMax: { load: number; weightUnit: WeightUnit; performedAt: string } | null;
  target: { load: number; weightUnit: WeightUnit } | null;
};

export type WorkoutPercentageTargets = {
  preferredWeightUnit: WeightUnit;
  targets: PercentageTarget[];
};

export function calculatePercentage(weight: number, percentage: number) {
  return weight * (percentage / 100);
}

export function roundToIncrement(value: number, increment: number) {
  return increment > 0 ? Math.round(value / increment) * increment : value;
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit) {
  if (from === to) return value;
  return from === "LB" ? value * 0.45359237 : value / 0.45359237;
}
