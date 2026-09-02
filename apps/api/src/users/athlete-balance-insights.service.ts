import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { createAthleteInsightsPeriodRange } from './athlete-insights-period';
import type {
  AthleteBalanceInsightsResponse,
  AthleteInsightsBreakdownItem,
  AthleteInsightsPeriodRange,
  AthleteInsightsUnderrepresentedArea,
} from './athlete-insights.types';
import type { FindAthleteInsightsQueryDto } from './dto/find-athlete-insights-query.dto';

type NamedReference = {
  key: string;
  name: string;
};

type BalanceDimension = AthleteInsightsUnderrepresentedArea['dimension'];

@Injectable()
export class AthleteBalanceInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(
    userId: string,
    query: FindAthleteInsightsQueryDto,
    now: Date = new Date(),
  ): Promise<AthleteBalanceInsightsResponse> {
    const athleteProfile = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!athleteProfile) {
      throw new NotFoundException('Athlete profile not found');
    }

    const range = createAthleteInsightsPeriodRange(query.period, now);
    const performedAt = {
      ...(range.startDate ? { gte: range.startDate } : {}),
      lt: range.endDate,
    };
    const [
      workoutResults,
      standaloneMovementResults,
      workoutTypes,
      movementCategories,
      workoutLevels,
      prescriptionCategories,
    ] = await Promise.all([
      this.prisma.workoutResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          performedAt,
        },
        select: {
          workout: {
            select: {
              type: { select: { key: true, name: true } },
            },
          },
          workoutVariant: {
            select: {
              level: { select: { key: true, name: true } },
              sections: {
                select: {
                  movements: {
                    select: {
                      movement: {
                        select: {
                          category: { select: { key: true, name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          prescriptionCategory: {
            select: { key: true, name: true },
          },
        },
      }),
      this.prisma.movementResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          sourceWorkoutResultId: null,
          performedAt,
        },
        select: {
          movement: {
            select: {
              category: { select: { key: true, name: true } },
            },
          },
        },
      }),
      this.prisma.workoutType.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { key: true, name: true },
      }),
      this.prisma.movementCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { key: true, name: true },
      }),
      this.prisma.workoutLevel.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { key: true, name: true },
      }),
      this.prisma.prescriptionCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { key: true, name: true },
      }),
    ]);

    const workoutTypeCounts = this.createCountMap(
      workoutResults.map((result) => result.workout.type),
    );
    const workoutLevelCounts = this.createCountMap(
      workoutResults.map((result) => result.workoutVariant.level),
    );
    const prescriptionCounts = this.createCountMap(
      workoutResults.flatMap((result) =>
        result.prescriptionCategory ? [result.prescriptionCategory] : [],
      ),
    );
    const workoutMovementCategories = workoutResults.flatMap((result) =>
      result.workoutVariant.sections.flatMap((section) =>
        section.movements.map((movement) => movement.movement.category),
      ),
    );
    const standaloneMovementCategories = standaloneMovementResults.map(
      (result) => result.movement.category,
    );
    const movementCategoryCounts = this.createCountMap([
      ...workoutMovementCategories,
      ...standaloneMovementCategories,
    ]);

    const workoutTypeBreakdown = this.createBreakdown(
      workoutTypes,
      workoutTypeCounts,
    );
    const movementCategoryBreakdown = this.createBreakdown(
      movementCategories,
      movementCategoryCounts,
    );
    const workoutLevelBreakdown = this.createBreakdown(
      workoutLevels,
      workoutLevelCounts,
    );
    const prescriptionBreakdown = this.createBreakdown(
      prescriptionCategories,
      prescriptionCounts,
    );

    return {
      period: this.mapPeriod(range, query.timeZone),
      balance: {
        workoutTypes: workoutTypeBreakdown,
        movementCategories: movementCategoryBreakdown,
        workoutLevels: workoutLevelBreakdown,
        prescriptionCategories: prescriptionBreakdown,
        underrepresentedAreas: [
          ...this.findUnderrepresented('WORKOUT_TYPE', workoutTypeBreakdown),
          ...this.findUnderrepresented(
            'MOVEMENT_CATEGORY',
            movementCategoryBreakdown,
          ),
          ...this.findUnderrepresented('WORKOUT_LEVEL', workoutLevelBreakdown),
          ...this.findUnderrepresented(
            'PRESCRIPTION_CATEGORY',
            prescriptionBreakdown,
          ),
        ]
          .sort((a, b) => a.percentage - b.percentage || a.count - b.count)
          .slice(0, 4),
      },
    };
  }

  private createCountMap(values: NamedReference[]) {
    const counts = new Map<string, number>();

    values.forEach((value) => {
      counts.set(value.key, (counts.get(value.key) ?? 0) + 1);
    });

    return counts;
  }

  private createBreakdown(
    references: NamedReference[],
    counts: Map<string, number>,
  ): AthleteInsightsBreakdownItem[] {
    const total = Array.from(counts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    return references
      .map((reference) => {
        const count = counts.get(reference.key) ?? 0;

        return {
          ...reference,
          count,
          percentage:
            total === 0 ? 0 : this.roundToOneDecimal((count / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  private findUnderrepresented(
    dimension: BalanceDimension,
    breakdown: AthleteInsightsBreakdownItem[],
  ): AthleteInsightsUnderrepresentedArea[] {
    if (!breakdown.some((item) => item.count > 0)) {
      return [];
    }

    return breakdown
      .filter((item) => item.percentage < 10)
      .map((item) => ({ dimension, ...item }));
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

  private roundToOneDecimal(value: number) {
    return Math.round(value * 10) / 10;
  }
}
