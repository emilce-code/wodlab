export type LeaderboardPeriod = "30D" | "90D" | "ALL";

export type WorkoutLeaderboardEntry = {
  rank: number;
  isCurrentAthlete: boolean;
  displayName: string;
  performedAt: string;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: "KG" | "LB" | null;
};

export type WorkoutLeaderboard = {
  workoutId: string;
  variantId: string;
  period: LeaderboardPeriod;
  resultTypeKey: string | null;
  participating: boolean;
  totalAthletes: number;
  currentAthleteRank: number | null;
  entries: WorkoutLeaderboardEntry[];
};
