import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { createAthleteInsightsPeriodRange } from './athlete-insights-period';
import type {
  AthleteInsightsComparison,
  AthleteInsightsPerformanceHighlight,
  AthleteInsightsPeriodRange,
  AthleteInsightsTrendDirection,
  AthletePerformanceInsightsResponse,
} from './athlete-insights.types';
import type { FindAthleteInsightsQueryDto } from './dto/find-athlete-insights-query.dto';

type TrackResult = {
  id: string;
  source: 'WORKOUT' | 'MOVEMENT';
  entityId: string;
  trackKey: string;
  name: string;
  metricKey: string;
  metricName: string;
  value: number;
  lowerIsBetter: boolean;
  supportsPercentage: boolean;
  performedAt: Date;
};

type TrackSummary = {
  direction: AthleteInsightsTrendDirection;
  improvementPercentage: number | null;
  results: TrackResult[];
};

@Injectable()
export class AthletePerformanceInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPerformance(
    userId: string,
    query: FindAthleteInsightsQueryDto,
    now: Date = new Date(),
  ): Promise<AthletePerformanceInsightsResponse> {
    const athleteProfile = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!athleteProfile) {
      throw new NotFoundException('Athlete profile not found');
    }

    const range = createAthleteInsightsPeriodRange(query.period, now);
    const [workoutResults, movementResults] = await Promise.all([
      this.prisma.workoutResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          performedAt: { lt: range.endDate },
        },
        select: {
          id: true,
          workoutId: true,
          performedAt: true,
          timeSeconds: true,
          rounds: true,
          reps: true,
          load: true,
          weightUnit: true,
          workout: {
            select: { name: true },
          },
          workoutVariant: {
            select: {
              level: {
                select: { key: true },
              },
            },
          },
          resultType: {
            select: { key: true, name: true },
          },
        },
        orderBy: [{ performedAt: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.movementResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          performedAt: { lt: range.endDate },
        },
        select: {
          id: true,
          movementId: true,
          performedAt: true,
          reps: true,
          load: true,
          weightUnit: true,
          distance: true,
          durationSeconds: true,
          calories: true,
          movement: {
            select: { name: true },
          },
          measurementType: {
            select: { id: true, key: true, name: true },
          },
        },
        orderBy: [{ performedAt: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const results = [
      ...workoutResults.flatMap((result) => this.mapWorkoutResult(result)),
      ...movementResults.flatMap((result) => this.mapMovementResult(result)),
    ].sort(
      (a, b) =>
        a.performedAt.getTime() - b.performedAt.getTime() ||
        a.id.localeCompare(b.id),
    );
    const personalRecordDates = this.getPersonalRecordDates(results);
    const currentPersonalRecords = this.countDatesInRange(
      personalRecordDates,
      range.startDate,
      range.endDate,
    );
    const previousPersonalRecords = range.previousEndDate
      ? this.countDatesInRange(
          personalRecordDates,
          range.previousStartDate,
          range.previousEndDate,
        )
      : null;
    const currentResults = results.filter((result) =>
      this.isInRange(result.performedAt, range.startDate, range.endDate),
    );
    const trackSummaries = this.createTrackSummaries(currentResults);
    const highlights = trackSummaries
      .map(({ direction, improvementPercentage, results: trackResults }) => {
        const latest = trackResults[trackResults.length - 1];

        return {
          id: latest.trackKey,
          source: latest.source,
          entityId: latest.entityId,
          name: latest.name,
          metricKey: latest.metricKey,
          metricName: latest.metricName,
          direction,
          improvementPercentage,
          attemptCount: trackResults.length,
          latestPerformedAt: latest.performedAt.toISOString(),
        } satisfies AthleteInsightsPerformanceHighlight;
      })
      .sort((a, b) => {
        const directionRank = { IMPROVING: 0, STABLE: 1, DECLINING: 2 };
        const rankDifference =
          directionRank[a.direction] - directionRank[b.direction];

        if (rankDifference !== 0) {
          return rankDifference;
        }

        return (
          Math.abs(b.improvementPercentage ?? 0) -
          Math.abs(a.improvementPercentage ?? 0)
        );
      })
      .slice(0, 6);

    return {
      period: this.mapPeriod(range, query.timeZone),
      performance: {
        personalRecords: this.createComparison(
          currentPersonalRecords,
          previousPersonalRecords,
        ),
        improvingTracks: trackSummaries.filter(
          (track) => track.direction === 'IMPROVING',
        ).length,
        stableTracks: trackSummaries.filter(
          (track) => track.direction === 'STABLE',
        ).length,
        decliningTracks: trackSummaries.filter(
          (track) => track.direction === 'DECLINING',
        ).length,
        highlights,
      },
    };
  }

  private mapWorkoutResult(result: {
    id: string;
    workoutId: string;
    performedAt: Date;
    timeSeconds: number | null;
    rounds: number | null;
    reps: number | null;
    load: unknown;
    weightUnit: 'KG' | 'LB' | null;
    workout: { name: string };
    workoutVariant: { level: { key: string } };
    resultType: { key: string; name: string };
  }): TrackResult[] {
    const base = {
      id: result.id,
      source: 'WORKOUT' as const,
      entityId: result.workoutId,
      trackKey: [
        'WORKOUT',
        result.workoutId,
        result.workoutVariant.level.key,
        result.resultType.key,
      ].join(':'),
      name: result.workout.name,
      metricKey: result.resultType.key,
      metricName: result.resultType.name,
      performedAt: result.performedAt,
    };

    switch (result.resultType.key) {
      case 'TIME':
        return result.timeSeconds === null
          ? []
          : [
              {
                ...base,
                value: result.timeSeconds,
                lowerIsBetter: true,
                supportsPercentage: true,
              },
            ];
      case 'ROUNDS_REPS':
        return [
          {
            ...base,
            value: (result.rounds ?? 0) * 1_000_000 + (result.reps ?? 0),
            lowerIsBetter: false,
            supportsPercentage: false,
          },
        ];
      case 'REPS':
        return result.reps === null
          ? []
          : [
              {
                ...base,
                value: result.reps,
                lowerIsBetter: false,
                supportsPercentage: true,
              },
            ];
      case 'LOAD':
        return result.load === null
          ? []
          : [
              {
                ...base,
                value: this.getLoadInKg(result.load, result.weightUnit),
                lowerIsBetter: false,
                supportsPercentage: true,
              },
            ];
      default:
        return [];
    }
  }

  private mapMovementResult(result: {
    id: string;
    movementId: string;
    performedAt: Date;
    reps: number | null;
    load: unknown;
    weightUnit: 'KG' | 'LB' | null;
    distance: number | null;
    durationSeconds: number | null;
    calories: number | null;
    movement: { name: string };
    measurementType: { id: string; key: string; name: string };
  }): TrackResult[] {
    const key = result.measurementType.key;
    const rawValue =
      key === 'WEIGHT'
        ? result.load === null
          ? null
          : this.getLoadInKg(result.load, result.weightUnit)
        : key === 'REPS'
          ? result.reps
          : key === 'DISTANCE'
            ? result.distance
            : key === 'DURATION'
              ? result.durationSeconds
              : key === 'CALORIES'
                ? result.calories
                : null;

    if (rawValue === null || (key === 'WEIGHT' && result.reps === null)) {
      return [];
    }

    return [
      {
        id: result.id,
        source: 'MOVEMENT',
        entityId: result.movementId,
        trackKey: [
          'MOVEMENT',
          result.movementId,
          result.measurementType.id,
          key === 'WEIGHT' ? result.reps : 'none',
        ].join(':'),
        name: result.movement.name,
        metricKey: key,
        metricName: result.measurementType.name,
        value: rawValue,
        lowerIsBetter: key === 'DURATION',
        supportsPercentage: true,
        performedAt: result.performedAt,
      },
    ];
  }

  private getPersonalRecordDates(results: TrackResult[]) {
    const bestByTrack = new Map<string, number>();
    const recordDates: Date[] = [];

    results.forEach((result) => {
      const previousBest = bestByTrack.get(result.trackKey);
      const isRecord =
        previousBest === undefined ||
        (result.lowerIsBetter
          ? result.value < previousBest
          : result.value > previousBest);

      if (isRecord) {
        bestByTrack.set(result.trackKey, result.value);
        recordDates.push(result.performedAt);
      }
    });

    return recordDates;
  }

  private createTrackSummaries(results: TrackResult[]): TrackSummary[] {
    const groups = new Map<string, TrackResult[]>();

    results.forEach((result) => {
      groups.set(result.trackKey, [
        ...(groups.get(result.trackKey) ?? []),
        result,
      ]);
    });

    return Array.from(groups.values())
      .filter((trackResults) => trackResults.length >= 2)
      .map((trackResults) => {
        const first = trackResults[0];
        const latest = trackResults[trackResults.length - 1];
        const rawChange = first.lowerIsBetter
          ? first.value - latest.value
          : latest.value - first.value;
        const improvementPercentage =
          first.supportsPercentage && first.value !== 0
            ? this.roundToOneDecimal((rawChange / first.value) * 100)
            : null;
        const stableThreshold = first.supportsPercentage
          ? Math.abs(improvementPercentage ?? 0) < 1
          : rawChange === 0;
        const direction: AthleteInsightsTrendDirection = stableThreshold
          ? 'STABLE'
          : rawChange > 0
            ? 'IMPROVING'
            : 'DECLINING';

        return { direction, improvementPercentage, results: trackResults };
      });
  }

  private countDatesInRange(
    dates: Date[],
    startDate: Date | null,
    endDate: Date,
  ) {
    return dates.filter((date) => this.isInRange(date, startDate, endDate))
      .length;
  }

  private isInRange(date: Date, startDate: Date | null, endDate: Date) {
    return (!startDate || date >= startDate) && date < endDate;
  }

  private createComparison(
    current: number,
    previous: number | null,
  ): AthleteInsightsComparison {
    return {
      current,
      previous,
      absoluteChange: previous === null ? null : current - previous,
      percentageChange:
        previous === null || previous === 0
          ? null
          : this.roundToOneDecimal(((current - previous) / previous) * 100),
    };
  }

  private mapPeriod(range: AthleteInsightsPeriodRange, timeZone: string) {
    return {
      key: range.key,
      timeZone,
      startDate: range.startDate?.toISOString() ?? null,
      endDate: range.endDate.toISOString(),
      previousStartDate: range.previousStartDate?.toISOString() ?? null,
      previousEndDate: range.previousEndDate?.toISOString() ?? null,
    };
  }

  private getLoadInKg(load: unknown, weightUnit: 'KG' | 'LB' | null) {
    const value = Number(load ?? 0);

    return weightUnit === 'LB' ? value * 0.45359237 : value;
  }

  private roundToOneDecimal(value: number) {
    return Math.round(value * 10) / 10;
  }
}
