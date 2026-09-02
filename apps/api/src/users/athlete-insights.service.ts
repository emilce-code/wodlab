import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { createAthleteInsightsPeriodRange } from './athlete-insights-period';
import type {
  AthleteConsistencyInsightsResponse,
  AthleteInsightsComparison,
} from './athlete-insights.types';
import type { FindAthleteInsightsQueryDto } from './dto/find-athlete-insights-query.dto';

const MILLISECONDS_PER_DAY = 86_400_000;

type Session = {
  performedAt: Date;
};

@Injectable()
export class AthleteInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getConsistency(
    userId: string,
    query: FindAthleteInsightsQueryDto,
    now: Date = new Date(),
  ): Promise<AthleteConsistencyInsightsResponse> {
    const athleteProfile = await this.prisma.athleteProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!athleteProfile) {
      throw new NotFoundException('Athlete profile not found');
    }

    const range = createAthleteInsightsPeriodRange(query.period, now);
    const dateFilter = {
      lt: range.endDate,
    };

    const [workoutResults, movementResults] = await Promise.all([
      this.prisma.workoutResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          performedAt: dateFilter,
        },
        select: {
          performedAt: true,
        },
      }),
      this.prisma.movementResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          sourceWorkoutResultId: null,
          performedAt: dateFilter,
        },
        select: {
          performedAt: true,
        },
      }),
    ]);

    const sessions = [...workoutResults, ...movementResults];
    const currentSessions = this.getSessionsInRange(
      sessions,
      range.startDate,
      range.endDate,
    );
    const previousSessions = range.previousEndDate
      ? this.getSessionsInRange(
          sessions,
          range.previousStartDate,
          range.previousEndDate,
        )
      : null;

    const currentActiveDays = this.getActiveDayKeys(
      currentSessions,
      query.timeZone,
    );
    const previousActiveDays = previousSessions
      ? this.getActiveDayKeys(previousSessions, query.timeZone)
      : null;

    const currentWeeklyAverage = this.getWeeklyAverage(
      currentSessions,
      range.startDate,
      range.endDate,
    );
    const previousWeeklyAverage = previousSessions
      ? this.getWeeklyAverage(
          previousSessions,
          range.previousStartDate,
          range.previousEndDate!,
        )
      : null;

    const allCurrentStreakDays = this.getActiveDayKeys(
      sessions.filter((session) => session.performedAt < range.endDate),
      query.timeZone,
    );

    return {
      period: {
        key: range.key,
        timeZone: query.timeZone,
        startDate: range.startDate?.toISOString() ?? null,
        endDate: range.endDate.toISOString(),
        previousStartDate: range.previousStartDate?.toISOString() ?? null,
        previousEndDate: range.previousEndDate?.toISOString() ?? null,
      },
      consistency: {
        totalSessions: this.createComparison(
          currentSessions.length,
          previousSessions?.length ?? null,
        ),
        activeDays: this.createComparison(
          currentActiveDays.length,
          previousActiveDays?.length ?? null,
        ),
        weeklyAverage: this.createComparison(
          currentWeeklyAverage,
          previousWeeklyAverage,
        ),
        currentStreak: this.getCurrentStreak(
          allCurrentStreakDays,
          now,
          query.timeZone,
        ),
        longestStreak: this.getLongestStreak(currentActiveDays),
      },
    };
  }

  private getSessionsInRange(
    sessions: Session[],
    startDate: Date | null,
    endDate: Date,
  ) {
    return sessions.filter(
      (session) =>
        (!startDate || session.performedAt >= startDate) &&
        session.performedAt < endDate,
    );
  }

  private getActiveDayKeys(sessions: Session[], timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return Array.from(
      new Set(
        sessions.map((session) => {
          const parts = formatter.formatToParts(session.performedAt);
          const getPart = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((part) => part.type === type)?.value ?? '';

          return [getPart('year'), getPart('month'), getPart('day')].join('-');
        }),
      ),
    ).sort();
  }

  private getWeeklyAverage(
    sessions: Session[],
    startDate: Date | null,
    endDate: Date,
  ) {
    const effectiveStart =
      startDate ??
      sessions.reduce<Date | null>(
        (earliest, session) =>
          !earliest || session.performedAt < earliest
            ? session.performedAt
            : earliest,
        null,
      ) ??
      endDate;
    const elapsedDays = Math.max(
      1,
      (endDate.getTime() - effectiveStart.getTime()) / MILLISECONDS_PER_DAY,
    );

    return this.roundToOneDecimal(sessions.length / (elapsedDays / 7));
  }

  private createComparison(
    current: number,
    previous: number | null,
  ): AthleteInsightsComparison {
    if (previous === null) {
      return {
        current,
        previous: null,
        absoluteChange: null,
        percentageChange: null,
      };
    }

    return {
      current,
      previous,
      absoluteChange: this.roundToOneDecimal(current - previous),
      percentageChange:
        previous === 0
          ? null
          : this.roundToOneDecimal(((current - previous) / previous) * 100),
    };
  }

  private getCurrentStreak(
    activeDayKeys: string[],
    now: Date,
    timeZone: string,
  ) {
    if (activeDayKeys.length === 0) {
      return 0;
    }

    const todayKey = this.getActiveDayKeys([{ performedAt: now }], timeZone)[0];
    const latestKey = activeDayKeys[activeDayKeys.length - 1];
    const daysSinceLatest = this.getDifferenceInDays(latestKey, todayKey);

    if (daysSinceLatest > 1) {
      return 0;
    }

    let streak = 1;

    for (let index = activeDayKeys.length - 1; index > 0; index -= 1) {
      if (
        this.getDifferenceInDays(
          activeDayKeys[index - 1],
          activeDayKeys[index],
        ) !== 1
      ) {
        break;
      }

      streak += 1;
    }

    return streak;
  }

  private getLongestStreak(activeDayKeys: string[]) {
    let longest = 0;
    let current = 0;

    activeDayKeys.forEach((dayKey, index) => {
      current =
        index > 0 &&
        this.getDifferenceInDays(activeDayKeys[index - 1], dayKey) === 1
          ? current + 1
          : 1;
      longest = Math.max(longest, current);
    });

    return longest;
  }

  private getDifferenceInDays(startKey: string, endKey: string) {
    return Math.round(
      (Date.parse(`${endKey}T00:00:00.000Z`) -
        Date.parse(`${startKey}T00:00:00.000Z`)) /
        MILLISECONDS_PER_DAY,
    );
  }

  private roundToOneDecimal(value: number) {
    return Math.round(value * 10) / 10;
  }
}
