import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScheduledWorkoutsController } from './scheduled-workouts.controller';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';

describe('ScheduledWorkoutsController', () => {
  let controller: ScheduledWorkoutsController;

  const scheduledWorkoutsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const jwtAuthGuardMock = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledWorkoutsController],
      providers: [
        {
          provide: ScheduledWorkoutsService,
          useValue: scheduledWorkoutsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .compile();

    controller = module.get(ScheduledWorkoutsController);
  });

  afterEach(() => jest.clearAllMocks());

  const request = {
    user: { userId: 'user-1', email: 'athlete@example.com' },
  } as Parameters<ScheduledWorkoutsController['findAll']>[0];

  it('creates a scheduled workout for the authenticated user', async () => {
    const dto = {
      workoutId: 'workout-1',
      workoutVariantId: 'variant-1',
      scheduledDate: '2026-09-07',
    };

    await controller.create(request, dto);

    expect(scheduledWorkoutsServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      dto,
    );
  });

  it('lists the authenticated user schedule', async () => {
    const query = { from: '2026-09-07', to: '2026-09-14' };

    await controller.findAll(request, query);

    expect(scheduledWorkoutsServiceMock.findAll).toHaveBeenCalledWith(
      'user-1',
      query,
    );
  });

  it('updates an owned scheduled workout', async () => {
    const dto = { scheduledDate: '2026-09-10' };

    await controller.update(request, 'scheduled-1', dto);

    expect(scheduledWorkoutsServiceMock.update).toHaveBeenCalledWith(
      'user-1',
      'scheduled-1',
      dto,
    );
  });

  it('removes an owned scheduled workout', async () => {
    await controller.remove(request, 'scheduled-1');

    expect(scheduledWorkoutsServiceMock.remove).toHaveBeenCalledWith(
      'user-1',
      'scheduled-1',
    );
  });
});
