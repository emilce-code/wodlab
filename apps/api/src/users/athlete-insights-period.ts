import type { AthleteInsightsPeriodRange } from './athlete-insights.types';
import { AthleteInsightsPeriod } from './dto/find-athlete-insights-query.dto';

const MILLISECONDS_PER_DAY = 86_400_000;

function subtractDays(value: Date, days: number): Date {
  return new Date(value.getTime() - days * MILLISECONDS_PER_DAY);
}

function subtractMonths(value: Date, months: number): Date {
  const result = new Date(value);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
}

function getPeriodStart(period: AthleteInsightsPeriod, endDate: Date) {
  switch (period) {
    case AthleteInsightsPeriod.THIRTY_DAYS:
      return subtractDays(endDate, 30);

    case AthleteInsightsPeriod.NINETY_DAYS:
      return subtractDays(endDate, 90);

    case AthleteInsightsPeriod.SIX_MONTHS:
      return subtractMonths(endDate, 6);

    case AthleteInsightsPeriod.ONE_YEAR:
      return subtractMonths(endDate, 12);

    case AthleteInsightsPeriod.ALL_TIME:
      return null;
  }
}

export function createAthleteInsightsPeriodRange(
  period: AthleteInsightsPeriod,
  now: Date = new Date(),
): AthleteInsightsPeriodRange {
  const endDate = new Date(now);
  const startDate = getPeriodStart(period, endDate);

  if (!startDate) {
    return {
      key: period,
      startDate: null,
      endDate,
      previousStartDate: null,
      previousEndDate: null,
    };
  }

  return {
    key: period,
    startDate,
    endDate,
    previousStartDate: getPeriodStart(period, startDate),
    previousEndDate: new Date(startDate),
  };
}
