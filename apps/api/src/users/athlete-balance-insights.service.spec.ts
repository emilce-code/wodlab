import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AthleteBalanceInsightsService } from './athlete-balance-insights.service';
import {
  AthleteInsightsPeriod,
  type FindAthleteInsightsQueryDto,
} from './dto/find-athlete-insights-query.dto';

type NamedReference = { key: string; name: string };

function workoutResultFixture({
  type,
  level,
  prescriptionCategory,
  movementCategories,
}: {
  type: NamedReference;
  level: NamedReference;
  prescriptionCategory: NamedReference | null;
  movementCategories: NamedReference[];
}) {
  return {
    workout: { type },
    workoutVariant: {
      level,
      sections: [
        {
          movements: movementCategories.map((category) => ({
            movement: { category },
          })),
        },
      ],
    },
    prescriptionCategory,
  };
}

describe('AthleteBalanceInsightsService', () => {
  let service: AthleteBalanceInsightsService;

  const prismaMock = {
    athleteProfile: { findUnique: jest.fn() },
    workoutResult: { findMany: jest.fn() },
    movementResult: { findMany: jest.fn() },
    workoutType: { findMany: jest.fn() },
    movementCategory: { findMany: jest.fn() },
    workoutLevel: { findMany: jest.fn() },
    prescriptionCategory: { findMany: jest.fn() },
  };

  const now = new Date('2026-09-02T15:00:00.000Z');
  const query: FindAthleteInsightsQueryDto = {
    period: AthleteInsightsPeriod.THIRTY_DAYS,
    timeZone: 'America/Asuncion',
  };

  const metcon = { key: 'METCON', name: 'Metcon' };
  const strength = { key: 'STRENGTH', name: 'Strength' };
  const gymnastics = { key: 'GYMNASTICS', name: 'Gymnastics' };
  const weightlifting = { key: 'WEIGHTLIFTING', name: 'Weightlifting' };
  const cardio = { key: 'CARDIO', name: 'Cardio' };
  const rx = { key: 'RX', name: 'Rx' };
  const scaled = { key: 'SCALED', name: 'Scaled' };
  const competition = { key: 'COMPETITION', name: 'Competition' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthleteBalanceInsightsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(AthleteBalanceInsightsService);
    prismaMock.athleteProfile.findUnique.mockResolvedValue({ id: 'athlete-1' });
    prismaMock.workoutResult.findMany.mockResolvedValue([]);
    prismaMock.movementResult.findMany.mockResolvedValue([]);
    prismaMock.workoutType.findMany.mockResolvedValue([metcon, strength]);
    prismaMock.movementCategory.findMany.mockResolvedValue([
      gymnastics,
      weightlifting,
      cardio,
    ]);
    prismaMock.workoutLevel.findMany.mockResolvedValue([rx, scaled]);
    prismaMock.prescriptionCategory.findMany.mockResolvedValue([
      rx,
      competition,
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  it('rejects users without an athlete profile', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getBalance('user-1', query, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('calculates workout, movement, level, and prescription distributions', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      workoutResultFixture({
        type: metcon,
        level: rx,
        prescriptionCategory: rx,
        movementCategories: [gymnastics, weightlifting],
      }),
      workoutResultFixture({
        type: strength,
        level: scaled,
        prescriptionCategory: null,
        movementCategories: [weightlifting],
      }),
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      { movement: { category: cardio } },
    ]);

    const result = await service.getBalance('user-1', query, now);

    expect(result.balance.workoutTypes).toEqual([
      { ...metcon, count: 1, percentage: 50 },
      { ...strength, count: 1, percentage: 50 },
    ]);
    expect(result.balance.movementCategories).toEqual([
      { ...weightlifting, count: 2, percentage: 50 },
      { ...cardio, count: 1, percentage: 25 },
      { ...gymnastics, count: 1, percentage: 25 },
    ]);
    expect(result.balance.workoutLevels).toEqual([
      { ...rx, count: 1, percentage: 50 },
      { ...scaled, count: 1, percentage: 50 },
    ]);
    expect(result.balance.prescriptionCategories[0]).toEqual({
      ...rx,
      count: 1,
      percentage: 100,
    });
  });

  it('excludes workout-generated movement results from standalone exposure', async () => {
    await service.getBalance('user-1', query, now);

    expect(prismaMock.movementResult.findMany).toHaveBeenCalledWith({
      where: {
        athleteProfileId: 'athlete-1',
        sourceWorkoutResultId: null,
        performedAt: {
          gte: new Date('2026-08-03T15:00:00.000Z'),
          lt: now,
        },
      },
      select: {
        movement: {
          select: {
            category: { select: { key: true, name: true } },
          },
        },
      },
    });
  });

  it('keeps unused reference values visible and flags them as underrepresented', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      workoutResultFixture({
        type: metcon,
        level: rx,
        prescriptionCategory: rx,
        movementCategories: [gymnastics],
      }),
    ]);

    const result = await service.getBalance('user-1', query, now);

    expect(result.balance.workoutTypes).toContainEqual({
      ...strength,
      count: 0,
      percentage: 0,
    });
    expect(result.balance.underrepresentedAreas).toContainEqual(
      expect.objectContaining({
        dimension: 'WORKOUT_TYPE',
        key: 'STRENGTH',
        count: 0,
      }),
    );
  });

  it('does not recommend underrepresented areas when there is no activity', async () => {
    const result = await service.getBalance('user-1', query, now);

    expect(result.balance.underrepresentedAreas).toEqual([]);
    expect(
      result.balance.workoutTypes.every((item) => item.percentage === 0),
    ).toBe(true);
  });

  it('uses an unbounded start date for all-time balance', async () => {
    await service.getBalance(
      'user-1',
      { period: AthleteInsightsPeriod.ALL_TIME, timeZone: 'UTC' },
      now,
    );

    expect(prismaMock.workoutResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          athleteProfileId: 'athlete-1',
          performedAt: { lt: now },
        },
      }),
    );
  });
});
