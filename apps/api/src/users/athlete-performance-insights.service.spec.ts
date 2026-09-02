import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AthletePerformanceInsightsService } from './athlete-performance-insights.service';
import {
  AthleteInsightsPeriod,
  type FindAthleteInsightsQueryDto,
} from './dto/find-athlete-insights-query.dto';

type WorkoutFixture = {
  id: string;
  workoutId: string;
  performedAt: Date;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;
  workout: { name: string };
  workoutVariant: { level: { key: string } };
  resultType: { key: string; name: string };
};

type MovementFixture = {
  id: string;
  movementId: string;
  performedAt: Date;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  durationSeconds: number | null;
  calories: number | null;
  movement: { name: string };
  measurementType: { id: string; key: string; name: string };
};

describe('AthletePerformanceInsightsService', () => {
  let service: AthletePerformanceInsightsService;

  const prismaMock = {
    athleteProfile: { findUnique: jest.fn() },
    workoutResult: { findMany: jest.fn() },
    movementResult: { findMany: jest.fn() },
  };

  const now = new Date('2026-09-02T15:00:00.000Z');
  const query: FindAthleteInsightsQueryDto = {
    period: AthleteInsightsPeriod.THIRTY_DAYS,
    timeZone: 'America/Asuncion',
  };

  function workoutFixture(
    overrides: Partial<WorkoutFixture> = {},
  ): WorkoutFixture {
    return {
      id: 'workout-result-1',
      workoutId: 'workout-1',
      performedAt: new Date('2026-08-10T14:00:00.000Z'),
      timeSeconds: 400,
      rounds: null,
      reps: null,
      load: null,
      weightUnit: null,
      workout: { name: 'Fran' },
      workoutVariant: { level: { key: 'RX' } },
      resultType: { key: 'TIME', name: 'Time' },
      ...overrides,
    };
  }

  function movementFixture(
    overrides: Partial<MovementFixture> = {},
  ): MovementFixture {
    return {
      id: 'movement-result-1',
      movementId: 'movement-1',
      performedAt: new Date('2026-08-10T14:00:00.000Z'),
      reps: 1,
      load: 100,
      weightUnit: 'KG',
      distance: null,
      durationSeconds: null,
      calories: null,
      movement: { name: 'Back Squat' },
      measurementType: { id: 'weight-id', key: 'WEIGHT', name: 'Weight' },
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthletePerformanceInsightsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(AthletePerformanceInsightsService);
    prismaMock.athleteProfile.findUnique.mockResolvedValue({ id: 'athlete-1' });
    prismaMock.workoutResult.findMany.mockResolvedValue([]);
    prismaMock.movementResult.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('rejects users without an athlete profile', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getPerformance('user-1', query, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('counts workout and movement PRs in current and previous periods', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      workoutFixture({
        id: 'w1',
        performedAt: new Date('2026-07-10T14:00:00Z'),
        timeSeconds: 400,
      }),
      workoutFixture({
        id: 'w2',
        performedAt: new Date('2026-07-20T14:00:00Z'),
        timeSeconds: 380,
      }),
      workoutFixture({
        id: 'w3',
        performedAt: new Date('2026-08-10T14:00:00Z'),
        timeSeconds: 390,
      }),
      workoutFixture({
        id: 'w4',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        timeSeconds: 370,
      }),
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      movementFixture({
        id: 'm1',
        performedAt: new Date('2026-07-15T14:00:00Z'),
        load: 100,
      }),
      movementFixture({
        id: 'm2',
        performedAt: new Date('2026-08-15T14:00:00Z'),
        load: 105,
      }),
    ]);

    const result = await service.getPerformance('user-1', query, now);

    expect(result.performance.personalRecords).toEqual({
      current: 2,
      previous: 3,
      absoluteChange: -1,
      percentageChange: -33.3,
    });
  });

  it('classifies improving, stable, and declining tracks', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      workoutFixture({ id: 'time-1', timeSeconds: 400 }),
      workoutFixture({
        id: 'time-2',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        timeSeconds: 360,
      }),
      workoutFixture({
        id: 'reps-1',
        workoutId: 'workout-2',
        timeSeconds: null,
        reps: 20,
        resultType: { key: 'REPS', name: 'Reps' },
      }),
      workoutFixture({
        id: 'reps-2',
        workoutId: 'workout-2',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        timeSeconds: null,
        reps: 20,
        resultType: { key: 'REPS', name: 'Reps' },
      }),
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      movementFixture({ id: 'load-1', load: 100 }),
      movementFixture({
        id: 'load-2',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        load: 90,
      }),
    ]);

    const result = await service.getPerformance('user-1', query, now);

    expect(result.performance.improvingTracks).toBe(1);
    expect(result.performance.stableTracks).toBe(1);
    expect(result.performance.decliningTracks).toBe(1);
    expect(result.performance.highlights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Fran',
          direction: 'IMPROVING',
          improvementPercentage: 10,
        }),
        expect.objectContaining({
          name: 'Back Squat',
          direction: 'DECLINING',
          improvementPercentage: -10,
        }),
      ]),
    );
  });

  it('normalizes pounds to kilograms before evaluating load trends', async () => {
    prismaMock.movementResult.findMany.mockResolvedValue([
      movementFixture({ id: 'kg', load: 100, weightUnit: 'KG' }),
      movementFixture({
        id: 'lb',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        load: 220,
        weightUnit: 'LB',
      }),
    ]);

    const result = await service.getPerformance('user-1', query, now);

    expect(result.performance.stableTracks).toBe(1);
    expect(result.performance.highlights[0].improvementPercentage).toBe(-0.2);
  });

  it('uses lexicographic rounds and reps comparison without a misleading percentage', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      workoutFixture({
        id: 'rr-1',
        timeSeconds: null,
        rounds: 5,
        reps: 10,
        resultType: { key: 'ROUNDS_REPS', name: 'Rounds + reps' },
      }),
      workoutFixture({
        id: 'rr-2',
        performedAt: new Date('2026-08-20T14:00:00Z'),
        timeSeconds: null,
        rounds: 6,
        reps: 0,
        resultType: { key: 'ROUNDS_REPS', name: 'Rounds + reps' },
      }),
    ]);

    const result = await service.getPerformance('user-1', query, now);

    expect(result.performance.improvingTracks).toBe(1);
    expect(result.performance.highlights[0].improvementPercentage).toBeNull();
  });

  it('omits tracks with fewer than two attempts from trend classification', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([workoutFixture()]);

    const result = await service.getPerformance('user-1', query, now);

    expect(result.performance.improvingTracks).toBe(0);
    expect(result.performance.stableTracks).toBe(0);
    expect(result.performance.decliningTracks).toBe(0);
    expect(result.performance.highlights).toEqual([]);
  });

  it('returns null PR comparisons for all-time insights', async () => {
    const result = await service.getPerformance(
      'user-1',
      { period: AthleteInsightsPeriod.ALL_TIME, timeZone: 'UTC' },
      now,
    );

    expect(result.performance.personalRecords).toEqual({
      current: 0,
      previous: null,
      absoluteChange: null,
      percentageChange: null,
    });
  });
});
