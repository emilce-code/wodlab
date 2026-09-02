import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AthleteInsightsService } from './athlete-insights.service';
import {
  AthleteInsightsPeriod,
  type FindAthleteInsightsQueryDto,
} from './dto/find-athlete-insights-query.dto';

describe('AthleteInsightsService', () => {
  let service: AthleteInsightsService;

  const prismaMock = {
    athleteProfile: {
      findUnique: jest.fn(),
    },
    workoutResult: {
      findMany: jest.fn(),
    },
    movementResult: {
      findMany: jest.fn(),
    },
  };

  const now = new Date('2026-09-02T15:00:00.000Z');

  const defaultQuery: FindAthleteInsightsQueryDto = {
    period: AthleteInsightsPeriod.THIRTY_DAYS,
    timeZone: 'America/Asuncion',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthleteInsightsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(AthleteInsightsService);

    prismaMock.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
    });
    prismaMock.workoutResult.findMany.mockResolvedValue([]);
    prismaMock.movementResult.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects users without an athlete profile', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getConsistency('user-1', defaultQuery, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('counts workout and standalone movement logs as sessions', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-08-31T14:00:00.000Z') },
      { performedAt: new Date('2026-09-01T14:00:00.000Z') },
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-09-01T18:00:00.000Z') },
    ]);

    const result = await service.getConsistency('user-1', defaultQuery, now);

    expect(result.consistency.totalSessions.current).toBe(3);
    expect(result.consistency.activeDays.current).toBe(2);
    expect(prismaMock.movementResult.findMany).toHaveBeenCalledWith({
      where: {
        athleteProfileId: 'athlete-1',
        sourceWorkoutResultId: null,
        performedAt: {
          lt: now,
        },
      },
      select: {
        performedAt: true,
      },
    });
  });

  it('compares the selected period with the immediately preceding period', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-07-10T14:00:00.000Z') },
      { performedAt: new Date('2026-07-11T14:00:00.000Z') },
      { performedAt: new Date('2026-08-10T14:00:00.000Z') },
      { performedAt: new Date('2026-08-11T14:00:00.000Z') },
      { performedAt: new Date('2026-08-12T14:00:00.000Z') },
      { performedAt: new Date('2026-08-13T14:00:00.000Z') },
    ]);

    const result = await service.getConsistency('user-1', defaultQuery, now);

    expect(result.consistency.totalSessions).toEqual({
      current: 4,
      previous: 2,
      absoluteChange: 2,
      percentageChange: 100,
    });
    expect(result.consistency.activeDays).toEqual({
      current: 4,
      previous: 2,
      absoluteChange: 2,
      percentageChange: 100,
    });
  });

  it('uses the requested timezone when grouping active days', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-09-02T02:30:00.000Z') },
      { performedAt: new Date('2026-09-02T13:00:00.000Z') },
    ]);

    const result = await service.getConsistency('user-1', defaultQuery, now);

    expect(result.consistency.activeDays.current).toBe(2);
    expect(result.period.timeZone).toBe('America/Asuncion');
  });

  it('calculates current and longest consecutive-day streaks', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-08-25T14:00:00.000Z') },
      { performedAt: new Date('2026-08-26T14:00:00.000Z') },
      { performedAt: new Date('2026-08-27T14:00:00.000Z') },
      { performedAt: new Date('2026-08-31T14:00:00.000Z') },
      { performedAt: new Date('2026-09-01T14:00:00.000Z') },
      { performedAt: new Date('2026-09-02T14:00:00.000Z') },
    ]);

    const result = await service.getConsistency('user-1', defaultQuery, now);

    expect(result.consistency.currentStreak).toBe(3);
    expect(result.consistency.longestStreak).toBe(3);
  });

  it('resets the current streak when the latest session is older than yesterday', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      { performedAt: new Date('2026-08-30T14:00:00.000Z') },
    ]);

    const result = await service.getConsistency('user-1', defaultQuery, now);

    expect(result.consistency.currentStreak).toBe(0);
  });

  it('returns null comparisons for all-time insights', async () => {
    const result = await service.getConsistency(
      'user-1',
      {
        period: AthleteInsightsPeriod.ALL_TIME,
        timeZone: 'UTC',
      },
      now,
    );

    expect(result.consistency.totalSessions).toEqual({
      current: 0,
      previous: null,
      absoluteChange: null,
      percentageChange: null,
    });
    expect(result.period.previousStartDate).toBeNull();
    expect(result.period.previousEndDate).toBeNull();
  });
});
