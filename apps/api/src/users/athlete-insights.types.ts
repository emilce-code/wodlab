import type { AthleteInsightsPeriod } from './dto/find-athlete-insights-query.dto';

export type AthleteInsightsPeriodRange = {
  key: AthleteInsightsPeriod;
  startDate: Date | null;
  endDate: Date;
  previousStartDate: Date | null;
  previousEndDate: Date | null;
};

export type AthleteInsightsPeriodResponse = {
  key: AthleteInsightsPeriod;
  timeZone: string;
  startDate: string | null;
  endDate: string;
  previousStartDate: string | null;
  previousEndDate: string | null;
};

export type AthleteConsistencyInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  consistency: AthleteInsightsResponse['consistency'];
};

export type AthletePerformanceInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  performance: AthleteInsightsResponse['performance'];
};

export type AthleteBalanceInsightsResponse = {
  period: AthleteInsightsPeriodResponse;
  balance: AthleteInsightsResponse['balance'];
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

export type AthleteInsightsUnderrepresentedArea =
  AthleteInsightsBreakdownItem & {
    dimension:
      | 'WORKOUT_TYPE'
      | 'MOVEMENT_CATEGORY'
      | 'WORKOUT_LEVEL'
      | 'PRESCRIPTION_CATEGORY';
  };

export type AthleteInsightsTrendDirection =
  'IMPROVING' | 'STABLE' | 'DECLINING';

export type AthleteInsightsPerformanceHighlight = {
  id: string;
  source: 'WORKOUT' | 'MOVEMENT';
  entityId: string;
  name: string;
  metricKey: string;
  metricName: string;
  direction: AthleteInsightsTrendDirection;
  improvementPercentage: number | null;
  attemptCount: number;
  latestPerformedAt: string;
};

export type AthleteInsightsResponse = {
  period: AthleteInsightsPeriodResponse;

  consistency: {
    totalSessions: AthleteInsightsComparison;
    activeDays: AthleteInsightsComparison;
    weeklyAverage: AthleteInsightsComparison;
    currentStreak: number;
    longestStreak: number;
  };

  performance: {
    personalRecords: AthleteInsightsComparison;
    improvingTracks: number;
    stableTracks: number;
    decliningTracks: number;
    highlights: AthleteInsightsPerformanceHighlight[];
  };

  balance: {
    workoutTypes: AthleteInsightsBreakdownItem[];
    movementCategories: AthleteInsightsBreakdownItem[];
    workoutLevels: AthleteInsightsBreakdownItem[];
    prescriptionCategories: AthleteInsightsBreakdownItem[];
    underrepresentedAreas: AthleteInsightsUnderrepresentedArea[];
  };
};
