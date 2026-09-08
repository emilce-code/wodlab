import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrainingCalculatorsController } from './training-calculators.controller';
import { TrainingCalculatorsService } from './training-calculators.service';

describe('TrainingCalculatorsController', () => {
  it('returns workout percentage targets for the authenticated user', async () => {
    const getWorkoutTargets = jest.fn().mockResolvedValue({ targets: [] });
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingCalculatorsController],
      providers: [
        {
          provide: TrainingCalculatorsService,
          useValue: { getWorkoutTargets },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();
    const controller = module.get(TrainingCalculatorsController);

    await expect(
      controller.getWorkoutTargets(
        { user: { userId: 'user-1' } } as never,
        'workout-1',
      ),
    ).resolves.toEqual({ targets: [] });
    expect(getWorkoutTargets).toHaveBeenCalledWith('user-1', 'workout-1');
  });
});
