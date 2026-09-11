import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type {
  MovementApproach,
  StrategyConfidence,
  StrategyEffort,
  StrategyResultValue,
  WorkoutStrategy,
} from './workout-strategy.types';

type ResultRecord = {
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: unknown;
  weightUnit: 'KG' | 'LB' | null;
};

@Injectable()
export class WorkoutStrategiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    userId: string,
    workoutId: string,
    requestedVariantId?: string,
  ): Promise<WorkoutStrategy> {
    const [athleteProfile, workout] = await Promise.all([
      this.prisma.athleteProfile.findUnique({
        where: { userId },
        select: { id: true, preferredWorkoutLevelId: true },
      }),
      this.prisma.workout.findUnique({
        where: { id: workoutId },
        select: {
          id: true,
          name: true,
          isActive: true,
          type: {
            select: {
              key: true,
              defaultResultType: { select: { key: true } },
            },
          },
          variants: {
            orderBy: { level: { sortOrder: 'asc' } },
            select: {
              id: true,
              name: true,
              levelId: true,
              level: { select: { key: true, name: true } },
              sections: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  order: true,
                  rounds: true,
                  durationSeconds: true,
                  restSeconds: true,
                  repScheme: true,
                  type: { select: { key: true } },
                  movements: {
                    orderBy: { order: 'asc' },
                    select: {
                      reps: true,
                      movement: { select: { id: true, name: true } },
                      prescriptions: {
                        select: { percentage: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!athleteProfile)
      throw new NotFoundException('Athlete profile not found');
    if (!workout?.isActive) throw new NotFoundException('Workout not found');

    const variant = requestedVariantId
      ? workout.variants.find((item) => item.id === requestedVariantId)
      : (workout.variants.find(
          (item) => item.levelId === athleteProfile.preferredWorkoutLevelId,
        ) ?? workout.variants[0]);

    if (!variant) throw new BadRequestException('Workout variant not found');

    const results = await this.prisma.workoutResult.findMany({
      where: {
        athleteProfileId: athleteProfile.id,
        workoutId,
        workoutVariantId: variant.id,
      },
      orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      select: {
        timeSeconds: true,
        rounds: true,
        reps: true,
        load: true,
        weightUnit: true,
      },
    });

    const resultTypeKey = workout.type.defaultResultType?.key ?? null;
    const values = results.map((result) => this.mapResult(result));
    const ranked = this.rankResults(values, resultTypeKey);
    const personalBest = ranked[0] ?? null;
    const recentMedian = ranked.length
      ? ranked[Math.floor(ranked.length / 2)]
      : null;
    const warnings: WorkoutStrategy['warnings'] = [];
    if (!results.length) warnings.push('NO_HISTORY');
    if (this.hasHighVolume(variant.sections)) warnings.push('HIGH_VOLUME');
    if (this.hasHeavyPercentage(variant.sections))
      warnings.push('HEAVY_PERCENTAGE');

    return {
      workout: {
        id: workout.id,
        name: workout.name,
        typeKey: workout.type.key,
      },
      variant: {
        id: variant.id,
        name: variant.name,
        level: variant.level,
      },
      history: {
        attempts: results.length,
        confidence: this.confidence(results.length),
        personalBest,
        recentMedian,
      },
      target: {
        resultTypeKey,
        lower: this.createTarget(
          personalBest,
          recentMedian,
          resultTypeKey,
          false,
        ),
        upper: this.createTarget(
          personalBest,
          recentMedian,
          resultTypeKey,
          true,
        ),
      },
      sections: variant.sections.map((section, index) => ({
        sectionId: section.id,
        order: section.order,
        typeKey: section.type.key,
        effort: this.sectionEffort(index, variant.sections.length),
        movements: section.movements.map((item) => {
          const reps =
            item.reps ??
            (section.repScheme.length ? Math.max(...section.repScheme) : null);
          return {
            movementId: item.movement.id,
            name: item.movement.name,
            reps,
            approach: this.movementApproach(reps),
          };
        }),
      })),
      transition: variant.sections.some((section) => section.restSeconds)
        ? 'USE_REST'
        : variant.sections.length > 1
          ? 'RESET_BREATHING'
          : 'MINIMIZE',
      warnings,
    };
  }

  private mapResult(result: ResultRecord): StrategyResultValue {
    return {
      timeSeconds: result.timeSeconds,
      rounds: result.rounds,
      reps: result.reps,
      load: result.load === null ? null : Number(result.load),
      weightUnit: result.weightUnit,
    };
  }

  private rankResults(
    values: StrategyResultValue[],
    resultTypeKey: string | null,
  ) {
    return [...values].sort((a, b) => {
      if (resultTypeKey === 'TIME')
        return (a.timeSeconds ?? Infinity) - (b.timeSeconds ?? Infinity);
      if (resultTypeKey === 'ROUNDS_REPS')
        return (
          (b.rounds ?? 0) - (a.rounds ?? 0) || (b.reps ?? 0) - (a.reps ?? 0)
        );
      if (resultTypeKey === 'LOAD')
        return this.normalizedLoad(b) - this.normalizedLoad(a);
      return (b.reps ?? 0) - (a.reps ?? 0);
    });
  }

  private normalizedLoad(value: StrategyResultValue) {
    const load = value.load ?? 0;
    return value.weightUnit === 'LB' ? load * 0.45359237 : load;
  }

  private createTarget(
    best: StrategyResultValue | null,
    median: StrategyResultValue | null,
    resultTypeKey: string | null,
    conservative: boolean,
  ) {
    if (!best || !median) return null;
    if (resultTypeKey === 'TIME') {
      return {
        ...best,
        timeSeconds: conservative ? median.timeSeconds : best.timeSeconds,
      };
    }
    return conservative ? median : best;
  }

  private confidence(attempts: number): StrategyConfidence {
    if (attempts === 0) return 'NONE';
    if (attempts < 3) return 'LOW';
    if (attempts < 6) return 'MEDIUM';
    return 'HIGH';
  }

  private sectionEffort(index: number, count: number): StrategyEffort {
    if (count === 1) return 'STEADY';
    if (index === 0) return 'CONTROLLED';
    if (index === count - 1) return 'HARD';
    return 'BUILD';
  }

  private movementApproach(reps: number | null): MovementApproach {
    if (reps === null) return 'STEADY_PACE';
    if (reps <= 8) return 'UNBROKEN';
    if (reps <= 20) return 'PLANNED_BREAKS';
    return 'SMALL_SETS';
  }

  private hasHighVolume(
    sections: Array<{
      rounds: number | null;
      repScheme: number[];
      movements: unknown[];
    }>,
  ) {
    return sections.some((section) => {
      const schemeVolume = section.repScheme.reduce(
        (sum, reps) => sum + reps,
        0,
      );
      return (
        schemeVolume * Math.max(section.movements.length, 1) >= 75 ||
        (section.rounds ?? 0) >= 8
      );
    });
  }

  private hasHeavyPercentage(
    sections: Array<{
      movements: Array<{ prescriptions: Array<{ percentage: unknown }> }>;
    }>,
  ) {
    return sections.some((section) =>
      section.movements.some((movement) =>
        movement.prescriptions.some(
          (prescription) =>
            prescription.percentage !== null &&
            Number(prescription.percentage) >= 80,
        ),
      ),
    );
  }
}
