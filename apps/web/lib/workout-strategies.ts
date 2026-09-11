import type { WeightUnit } from "./result-types";

export type StrategyResultValue = {
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;
};

export type WorkoutStrategy = {
  workout: { id: string; name: string; typeKey: string };
  variant: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  };
  history: {
    attempts: number;
    confidence: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    personalBest: StrategyResultValue | null;
    recentMedian: StrategyResultValue | null;
  };
  target: {
    resultTypeKey: string | null;
    lower: StrategyResultValue | null;
    upper: StrategyResultValue | null;
  };
  sections: Array<{
    sectionId: string;
    order: number;
    typeKey: string;
    effort: "CONTROLLED" | "STEADY" | "BUILD" | "HARD";
    movements: Array<{
      movementId: string;
      name: string;
      reps: number | null;
      approach: "UNBROKEN" | "SMALL_SETS" | "PLANNED_BREAKS" | "STEADY_PACE";
    }>;
  }>;
  transition: "MINIMIZE" | "RESET_BREATHING" | "USE_REST";
  warnings: Array<"NO_HISTORY" | "HIGH_VOLUME" | "HEAVY_PERCENTAGE">;
};
