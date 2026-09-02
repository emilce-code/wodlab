import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutResultsService } from './workout-results.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsController', () => {
  let controller: WorkoutsController;

  const workoutsServiceMock = {
    findArchived: jest.fn(),
    findOne: jest.fn(),
    deactivate: jest.fn(),
    reactivate: jest.fn(),
    delete: jest.fn(),
  };
  const workoutResultsServiceMock = {};

  const jwtAuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  const request = {
    user: { userId: 'user-1' } as AuthenticatedUser,
  } as Request & { user: AuthenticatedUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [
        {
          provide: WorkoutsService,
          useValue: workoutsServiceMock,
        },
        {
          provide: WorkoutResultsService,
          useValue: workoutResultsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .compile();

    controller = module.get<WorkoutsController>(WorkoutsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lists archived workouts for the authenticated creator', async () => {
    workoutsServiceMock.findArchived.mockResolvedValue([]);
    await controller.findArchived(request);
    expect(workoutsServiceMock.findArchived).toHaveBeenCalledWith('user-1');
  });

  it('passes the authenticated user when reading a workout', async () => {
    workoutsServiceMock.findOne.mockResolvedValue({ id: 'workout-1' });
    await controller.findOne(request, 'workout-1');
    expect(workoutsServiceMock.findOne).toHaveBeenCalledWith(
      'workout-1',
      'user-1',
    );
  });

  it('delegates deactivate, reactivate, and delete lifecycle actions', async () => {
    workoutsServiceMock.deactivate.mockResolvedValue({ id: 'workout-1' });
    workoutsServiceMock.reactivate.mockResolvedValue({ id: 'workout-1' });
    workoutsServiceMock.delete.mockResolvedValue({
      id: 'workout-1',
      deleted: true,
    });

    await controller.deactivate(request, 'workout-1');
    await controller.reactivate(request, 'workout-1');
    await controller.delete(request, 'workout-1');

    expect(workoutsServiceMock.deactivate).toHaveBeenCalledWith(
      'user-1',
      'workout-1',
    );
    expect(workoutsServiceMock.reactivate).toHaveBeenCalledWith(
      'user-1',
      'workout-1',
    );
    expect(workoutsServiceMock.delete).toHaveBeenCalledWith(
      'user-1',
      'workout-1',
    );
  });
});
