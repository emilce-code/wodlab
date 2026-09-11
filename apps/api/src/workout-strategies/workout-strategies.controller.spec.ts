import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutStrategiesController } from './workout-strategies.controller';
import { WorkoutStrategiesService } from './workout-strategies.service';

describe('WorkoutStrategiesController', () => {
  it('delegates using the authenticated athlete and requested variation', async () => {
    const strategies = { findOne: jest.fn().mockResolvedValue({}) };
    const module = await Test.createTestingModule({
      controllers: [WorkoutStrategiesController],
      providers: [{ provide: WorkoutStrategiesService, useValue: strategies }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(WorkoutStrategiesController);

    await controller.findOne(
      { user: { userId: 'user-1' } } as never,
      'workout-1',
      { variantId: 'variant-1' },
    );
    expect(strategies.findOne).toHaveBeenCalledWith(
      'user-1',
      'workout-1',
      'variant-1',
    );
  });
});
