import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutResultsService } from './workout-results.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsController', () => {
  let controller: WorkoutsController;

  const workoutsServiceMock = {};

  const workoutResultsServiceMock = {};

  const jwtAuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

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
});
