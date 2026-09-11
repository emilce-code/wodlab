import { NotFoundException } from '@nestjs/common';

import { LeaderboardsService } from './leaderboards.service';

const result = (overrides: Record<string, unknown>) => ({
  id: 'result-1',
  athleteProfileId: 'athlete-1',
  performedAt: new Date('2026-09-01T12:00:00Z'),
  timeSeconds: 100,
  rounds: null,
  reps: null,
  load: null,
  weightUnit: null,
  athleteProfile: { displayName: 'Ada' },
  ...overrides,
});

describe('LeaderboardsService', () => {
  function setup(resultTypeKey = 'TIME') {
    const prisma = {
      athleteProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'athlete-1',
          leaderboardEnabled: true,
        }),
      },
      workout: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'workout-1',
          type: { defaultResultType: { key: resultTypeKey } },
          variants: [{ id: 'variant-1' }],
        }),
      },
      workoutResult: { findMany: jest.fn() },
    };
    return { prisma, service: new LeaderboardsService(prisma as never) };
  }

  it('keeps each athlete best time and assigns competition ranks', async () => {
    const { prisma, service } = setup();
    prisma.workoutResult.findMany.mockResolvedValue([
      result({ id: 'slow', timeSeconds: 120 }),
      result({ id: 'fast', timeSeconds: 90 }),
      result({
        id: 'other',
        athleteProfileId: 'athlete-2',
        athleteProfile: { displayName: 'Bea' },
        timeSeconds: 90,
      }),
    ]);

    const response = await service.findWorkoutLeaderboard(
      'user-1',
      'workout-1',
      {
        variantId: 'variant-1',
        period: 'ALL',
      },
    );

    expect(response.entries).toHaveLength(2);
    expect(response.entries.map((entry) => entry.rank)).toEqual([1, 1]);
    expect(response.currentAthleteRank).toBe(1);
  });

  it('normalizes pounds and kilograms for load ranking', async () => {
    const { prisma, service } = setup('LOAD');
    prisma.workoutResult.findMany.mockResolvedValue([
      result({ load: 100, weightUnit: 'KG' }),
      result({
        id: 'other',
        athleteProfileId: 'athlete-2',
        athleteProfile: { displayName: 'Bea' },
        load: 225,
        weightUnit: 'LB',
      }),
    ]);

    const response = await service.findWorkoutLeaderboard(
      'user-1',
      'workout-1',
      {
        variantId: 'variant-1',
        period: '30D',
      },
    );
    expect(response.entries[0].displayName).toBe('Bea');
  });

  it('does not expose an opted-out athlete in entries', async () => {
    const { prisma, service } = setup();
    prisma.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
      leaderboardEnabled: false,
    });
    prisma.workoutResult.findMany.mockResolvedValue([]);

    const response = await service.findWorkoutLeaderboard(
      'user-1',
      'workout-1',
      {
        variantId: 'variant-1',
        period: '90D',
      },
    );
    expect(response.participating).toBe(false);
    expect(response.currentAthleteRank).toBeNull();
  });

  it('rejects a variation from another workout', async () => {
    const { service } = setup();
    await expect(
      service.findWorkoutLeaderboard('user-1', 'workout-1', {
        variantId: 'other',
        period: '30D',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
