import { createAthleteInsightsPeriodRange } from './athlete-insights-period';
import { AthleteInsightsPeriod } from './dto/find-athlete-insights-query.dto';

describe('createAthleteInsightsPeriodRange', () => {
  const now = new Date('2026-09-02T15:30:00.000Z');

  it.each([
    {
      period: AthleteInsightsPeriod.THIRTY_DAYS,
      startDate: '2026-08-03T15:30:00.000Z',
      previousStartDate: '2026-07-04T15:30:00.000Z',
    },
    {
      period: AthleteInsightsPeriod.NINETY_DAYS,
      startDate: '2026-06-04T15:30:00.000Z',
      previousStartDate: '2026-03-06T15:30:00.000Z',
    },
    {
      period: AthleteInsightsPeriod.SIX_MONTHS,
      startDate: '2026-03-02T15:30:00.000Z',
      previousStartDate: '2025-09-02T15:30:00.000Z',
    },
    {
      period: AthleteInsightsPeriod.ONE_YEAR,
      startDate: '2025-09-02T15:30:00.000Z',
      previousStartDate: '2024-09-02T15:30:00.000Z',
    },
  ])(
    'creates adjacent current and previous ranges for $period',
    ({ period, startDate, previousStartDate }) => {
      const result = createAthleteInsightsPeriodRange(period, now);

      expect(result).toEqual({
        key: period,
        startDate: new Date(startDate),
        endDate: now,
        previousStartDate: new Date(previousStartDate),
        previousEndDate: new Date(startDate),
      });
    },
  );

  it('returns an unbounded range without a previous period for all time', () => {
    expect(
      createAthleteInsightsPeriodRange(AthleteInsightsPeriod.ALL_TIME, now),
    ).toEqual({
      key: AthleteInsightsPeriod.ALL_TIME,
      startDate: null,
      endDate: now,
      previousStartDate: null,
      previousEndDate: null,
    });
  });

  it('clamps calendar periods to the final day of shorter months', () => {
    const endOfAugust = new Date('2024-08-31T12:00:00.000Z');

    const result = createAthleteInsightsPeriodRange(
      AthleteInsightsPeriod.SIX_MONTHS,
      endOfAugust,
    );

    expect(result.startDate).toEqual(new Date('2024-02-29T12:00:00.000Z'));
  });

  it('does not mutate the supplied reference date', () => {
    const referenceDate = new Date(now);
    const originalTimestamp = referenceDate.getTime();

    createAthleteInsightsPeriodRange(
      AthleteInsightsPeriod.ONE_YEAR,
      referenceDate,
    );

    expect(referenceDate.getTime()).toBe(originalTimestamp);
  });
});
