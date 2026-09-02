export type AthleteInsightsPeriod = "30D" | "90D" | "6M" | "1Y" | "ALL";

export type AthleteInsightsPeriodResponse = {
  key: AthleteInsightsPeriod;
  timeZone: string;
  startDate: string | null;
  endDate: string;
  previousStartDate: string | null;
  previousEndDate: string | null;
};

export type AthleteInsightsComparison = {
  current: number;
  previous: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
};

export type AthleteInsightsBreakdownItem = {
  key: string;
  name: string;
  count: number;
  percentage: number;
};

export type AthleteConsistencyInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  consistency: {
    totalSessions: AthleteInsightsComparison;
    activeDays: AthleteInsightsComparison;
    weeklyAverage: AthleteInsightsComparison;
    currentStreak: number;
    longestStreak: number;
  };
};

export type AthletePerformanceInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  performance: {
    personalRecords: AthleteInsightsComparison;
    improvingTracks: number;
    stableTracks: number;
    decliningTracks: number;
    highlights: {
      id: string;
      source: "WORKOUT" | "MOVEMENT";
      entityId: string;
      name: string;
      metricKey: string;
      metricName: string;
      direction: "IMPROVING" | "STABLE" | "DECLINING";
      improvementPercentage: number | null;
      attemptCount: number;
      latestPerformedAt: string;
    }[];
  };
};

export type AthleteBalanceInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  balance: {
    workoutTypes: AthleteInsightsBreakdownItem[];
    movementCategories: AthleteInsightsBreakdownItem[];
    workoutLevels: AthleteInsightsBreakdownItem[];
    prescriptionCategories: AthleteInsightsBreakdownItem[];
    underrepresentedAreas: (AthleteInsightsBreakdownItem & {
      dimension:
        | "WORKOUT_TYPE"
        | "MOVEMENT_CATEGORY"
        | "WORKOUT_LEVEL"
        | "PRESCRIPTION_CATEGORY";
    })[];
  };
};

export type AthleteInsightsData = {
  consistency: AthleteConsistencyInsightsResponse["consistency"];
  performance: AthletePerformanceInsightsResponse["performance"];
  balance: AthleteBalanceInsightsResponse["balance"];
};
