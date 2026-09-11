import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  FindWorkoutLeaderboardQueryDto,
  type LeaderboardPeriod,
} from './dto/find-workout-leaderboard-query.dto';

type RankedResult = {
  id: string;
  athleteProfileId: string;
  performedAt: Date;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: unknown;
  weightUnit: 'KG' | 'LB' | null;
  athleteProfile: { displayName: string };
};

@Injectable()
export class LeaderboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findWorkoutLeaderboard(
    userId: string,
    workoutId: string,
    query: FindWorkoutLeaderboardQueryDto,
  ) {
    const [athlete, workout] = await Promise.all([
      this.prisma.athleteProfile.findUnique({
        where: { userId },
        select: { id: true, leaderboardEnabled: true },
      }),
      this.prisma.workout.findUnique({
        where: { id: workoutId },
        select: {
          id: true,
          type: {
            select: {
              defaultResultType: { select: { key: true } },
            },
          },
          variants: { select: { id: true } },
        },
      }),
    ]);

    if (!athlete) throw new NotFoundException('Athlete profile not found');
    if (!workout) throw new NotFoundException('Workout not found');
    if (!workout.variants.some((variant) => variant.id === query.variantId)) {
      throw new NotFoundException('Workout variation not found');
    }

    const resultTypeKey = workout.type.defaultResultType?.key ?? null;
    const since = this.getPeriodStart(query.period);
    const results = await this.prisma.workoutResult.findMany({
      where: {
        workoutId,
        workoutVariantId: query.variantId,
        athleteProfile: { leaderboardEnabled: true },
        ...(since ? { performedAt: { gte: since } } : {}),
      },
      select: {
        id: true,
        athleteProfileId: true,
        performedAt: true,
        timeSeconds: true,
        rounds: true,
        reps: true,
        load: true,
        weightUnit: true,
        athleteProfile: { select: { displayName: true } },
      },
      orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const bestByAthlete = new Map<string, RankedResult>();
    for (const result of results) {
      if (!this.isValidResult(result, resultTypeKey)) continue;
      const current = bestByAthlete.get(result.athleteProfileId);
      if (!current || this.compare(result, current, resultTypeKey) < 0) {
        bestByAthlete.set(result.athleteProfileId, result);
      }
    }

    const ranked = [...bestByAthlete.values()].sort((a, b) =>
      this.compare(a, b, resultTypeKey),
    );
    let previous: RankedResult | null = null;
    let rank = 0;
    const entries = ranked.map((result, index) => {
      if (!previous || this.compare(result, previous, resultTypeKey) !== 0) {
        rank = index + 1;
      }
      previous = result;
      return {
        rank,
        isCurrentAthlete: result.athleteProfileId === athlete.id,
        displayName: result.athleteProfile.displayName,
        performedAt: result.performedAt,
        timeSeconds: result.timeSeconds,
        rounds: result.rounds,
        reps: result.reps,
        load: result.load === null ? null : Number(result.load),
        weightUnit: result.weightUnit,
      };
    });

    return {
      workoutId,
      variantId: query.variantId,
      period: query.period,
      resultTypeKey,
      participating: athlete.leaderboardEnabled,
      totalAthletes: entries.length,
      currentAthleteRank:
        entries.find((entry) => entry.isCurrentAthlete)?.rank ?? null,
      entries,
    };
  }

  private getPeriodStart(period: LeaderboardPeriod) {
    if (period === 'ALL') return null;
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (period === '30D' ? 30 : 90));
    return date;
  }

  private isValidResult(result: RankedResult, type: string | null) {
    if (type === 'TIME') return result.timeSeconds !== null;
    if (type === 'ROUNDS_REPS') return result.rounds !== null;
    if (type === 'REPS') return result.reps !== null;
    if (type === 'LOAD') return result.load !== null;
    return false;
  }

  private compare(a: RankedResult, b: RankedResult, type: string | null) {
    if (type === 'TIME')
      return (a.timeSeconds ?? Infinity) - (b.timeSeconds ?? Infinity);
    if (type === 'ROUNDS_REPS') {
      return (
        (b.rounds ?? -1) - (a.rounds ?? -1) || (b.reps ?? 0) - (a.reps ?? 0)
      );
    }
    if (type === 'REPS') return (b.reps ?? -1) - (a.reps ?? -1);
    if (type === 'LOAD') return this.loadInKg(b) - this.loadInKg(a);
    return 0;
  }

  private loadInKg(result: RankedResult) {
    const load = result.load === null ? -1 : Number(result.load);
    return result.weightUnit === 'LB' ? load * 0.45359237 : load;
  }
}
