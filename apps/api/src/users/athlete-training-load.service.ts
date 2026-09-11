import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AthleteTrainingLoadResponse } from './athlete-insights.types';

const DAY = 86_400_000;
const LB_TO_KG = 0.45359237;

type Session = { date: Date; volumeKg: number };

@Injectable()
export class AthleteTrainingLoadService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrainingLoad(
    userId: string,
    now: Date = new Date(),
  ): Promise<AthleteTrainingLoadResponse> {
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!athlete) throw new NotFoundException('Athlete profile not found');

    const end = this.startDay(now);
    end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(end.getTime() - 56 * DAY);
    const [workouts, standalone] = await Promise.all([
      this.prisma.workoutResult.findMany({
        where: {
          athleteProfileId: athlete.id,
          performedAt: { gte: start, lt: end },
        },
        select: {
          performedAt: true,
          load: true,
          reps: true,
          weightUnit: true,
          performedMovements: {
            select: { reps: true, load: true, weightUnit: true },
          },
        },
      }),
      this.prisma.movementResult.findMany({
        where: {
          athleteProfileId: athlete.id,
          sourceWorkoutResultId: null,
          performedAt: { gte: start, lt: end },
        },
        select: { performedAt: true, load: true, reps: true, weightUnit: true },
      }),
    ]);

    const byDay = new Map<string, Session>();
    const add = (date: Date, volumeKg: number) => {
      const key = this.startDay(date).toISOString();
      const current = byDay.get(key);
      byDay.set(key, {
        date: this.startDay(date),
        volumeKg: (current?.volumeKg ?? 0) + volumeKg,
      });
    };
    for (const result of workouts) {
      let volume = this.volume(result.load, result.reps, result.weightUnit);
      for (const movement of result.performedMovements)
        volume += this.volume(
          movement.load,
          movement.reps,
          movement.weightUnit,
        );
      add(result.performedAt, volume);
    }
    for (const result of standalone)
      add(
        result.performedAt,
        this.volume(result.load, result.reps, result.weightUnit),
      );

    const sessions = [...byDay.values()];
    const weekStart = new Date(end.getTime() - 7 * DAY);
    const previousWeekStart = new Date(end.getTime() - 14 * DAY);
    const chronicStart = new Date(end.getTime() - 28 * DAY);
    const acute = sessions.filter((item) => item.date >= weekStart);
    const chronic = sessions.filter((item) => item.date >= chronicStart);
    const previous = sessions.filter(
      (item) => item.date >= previousWeekStart && item.date < weekStart,
    );
    const acuteLoad = this.load(acute);
    const chronicWeeklyLoad = this.round(this.load(chronic) / 4);
    const ratio =
      chronicWeeklyLoad > 0 ? this.round(acuteLoad / chronicWeeklyLoad) : null;

    return {
      generatedAt: now.toISOString(),
      acuteLoad,
      chronicWeeklyLoad,
      workloadRatio: ratio,
      status: this.status(ratio),
      sessionsLast7Days: acute.length,
      sessionsLast28Days: chronic.length,
      restDaysLast7Days: Math.max(0, 7 - acute.length),
      consecutiveTrainingDays: this.consecutiveDays(byDay, end),
      volumeKgLast7Days: this.round(
        acute.reduce((sum, item) => sum + item.volumeKg, 0),
      ),
      volumeKgPrevious7Days: this.round(
        previous.reduce((sum, item) => sum + item.volumeKg, 0),
      ),
      recommendation:
        ratio === null
          ? 'ESTABLISH_BASELINE'
          : ratio > 1.5 || this.consecutiveDays(byDay, end) >= 5
            ? 'RECOVER'
            : ratio < 0.8
              ? 'BUILD'
              : 'MAINTAIN',
      weeks: Array.from({ length: 8 }, (_, index) => {
        const weekEnd = new Date(end.getTime() - (7 - index) * 7 * DAY);
        const weekStartDate = new Date(weekEnd.getTime() - 7 * DAY);
        const values = sessions.filter(
          (item) => item.date >= weekStartDate && item.date < weekEnd,
        );
        return {
          startDate: weekStartDate.toISOString(),
          endDate: weekEnd.toISOString(),
          load: this.load(values),
          sessions: values.length,
          volumeKg: this.round(
            values.reduce((sum, item) => sum + item.volumeKg, 0),
          ),
        };
      }),
    };
  }

  private volume(load: unknown, reps: number | null, unit: string | null) {
    const numericLoad = Number(load ?? 0);
    if (!numericLoad || !reps) return 0;
    return numericLoad * reps * (unit === 'LB' ? LB_TO_KG : 1);
  }

  private load(values: Session[]) {
    return this.round(
      values.reduce(
        (sum, item) => sum + 100 + Math.min(200, Math.sqrt(item.volumeKg) * 2),
        0,
      ),
    );
  }

  private status(ratio: number | null): AthleteTrainingLoadResponse['status'] {
    if (ratio === null) return 'NO_BASELINE';
    if (ratio < 0.8) return 'DETRAINING';
    if (ratio <= 1.3) return 'BALANCED';
    if (ratio <= 1.5) return 'ELEVATED';
    return 'HIGH';
  }

  private consecutiveDays(byDay: Map<string, Session>, end: Date) {
    let count = 0;
    for (let offset = 1; offset <= 56; offset += 1) {
      const date = new Date(end.getTime() - offset * DAY);
      if (!byDay.has(date.toISOString())) break;
      count += 1;
    }
    return count;
  }

  private startDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  private round(value: number) {
    return Math.round(value * 10) / 10;
  }
}
