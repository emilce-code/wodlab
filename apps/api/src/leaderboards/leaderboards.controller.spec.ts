import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardsController } from './leaderboards.controller';
import { LeaderboardsService } from './leaderboards.service';

describe('LeaderboardsController', () => {
  it('delegates a workout leaderboard request', async () => {
    const leaderboards = { findWorkoutLeaderboard: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [LeaderboardsController],
      providers: [{ provide: LeaderboardsService, useValue: leaderboards }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    await module
      .get(LeaderboardsController)
      .findWorkoutLeaderboard(
        { user: { userId: 'user-1' } } as never,
        'workout-1',
        { variantId: 'variant-1', period: '30D' },
      );

    expect(leaderboards.findWorkoutLeaderboard).toHaveBeenCalledWith(
      'user-1',
      'workout-1',
      { variantId: 'variant-1', period: '30D' },
    );
  });
});
