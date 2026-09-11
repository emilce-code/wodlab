import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WorkoutStrategiesService } from './workout-strategies.service';

describe('WorkoutStrategiesService', () => {
  let service: WorkoutStrategiesService;
  const prisma = {
    athleteProfile: { findUnique: jest.fn() },
    workout: { findUnique: jest.fn() },
    workoutResult: { findMany: jest.fn() },
  };
  const variant = {
    id: 'variant-1',
    name: null,
    levelId: 'level-1',
    level: { key: 'INTERMEDIATE', name: 'Intermediate' },
    sections: [
      {
        id: 'section-1',
        order: 1,
        rounds: 3,
        durationSeconds: null,
        restSeconds: null,
        repScheme: [],
        type: { key: 'FOR_TIME' },
        movements: [
          {
            reps: 21,
            movement: { id: 'movement-1', name: 'Thruster' },
            prescriptions: [{ percentage: null }],
          },
        ],
      },
    ],
  };
  const workout = {
    id: 'workout-1',
    name: 'Fran',
    isActive: true,
    type: { key: 'FOR_TIME', defaultResultType: { key: 'TIME' } },
    variants: [variant],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkoutStrategiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(WorkoutStrategiesService);
    prisma.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
      preferredWorkoutLevelId: 'level-1',
    });
    prisma.workout.findUnique.mockResolvedValue(workout);
    prisma.workoutResult.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns a conservative first-attempt strategy', async () => {
    await expect(service.findOne('user-1', 'workout-1')).resolves.toMatchObject(
      {
        history: { attempts: 0, confidence: 'NONE' },
        target: { resultTypeKey: 'TIME', lower: null, upper: null },
        sections: [
          {
            effort: 'STEADY',
            movements: [{ approach: 'SMALL_SETS' }],
          },
        ],
        transition: 'MINIMIZE',
        warnings: ['NO_HISTORY'],
      },
    );
  });

  it('uses the best and median time as the target range', async () => {
    prisma.workoutResult.findMany.mockResolvedValue([
      {
        timeSeconds: 360,
        rounds: null,
        reps: null,
        load: null,
        weightUnit: null,
      },
      {
        timeSeconds: 300,
        rounds: null,
        reps: null,
        load: null,
        weightUnit: null,
      },
      {
        timeSeconds: 330,
        rounds: null,
        reps: null,
        load: null,
        weightUnit: null,
      },
    ]);

    const result = await service.findOne('user-1', 'workout-1', 'variant-1');
    expect(result.history.confidence).toBe('MEDIUM');
    expect(result.target.lower?.timeSeconds).toBe(300);
    expect(result.target.upper?.timeSeconds).toBe(330);
  });

  it('rejects a variation that does not belong to the workout', async () => {
    await expect(
      service.findOne('user-1', 'workout-1', 'variant-other'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not expose inactive workouts', async () => {
    prisma.workout.findUnique.mockResolvedValue({
      ...workout,
      isActive: false,
    });
    await expect(service.findOne('user-1', 'workout-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
