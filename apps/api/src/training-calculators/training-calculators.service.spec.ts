import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TrainingCalculatorsService } from './training-calculators.service';

describe('TrainingCalculatorsService', () => {
  let service: TrainingCalculatorsService;

  const prismaMock = {
    athleteProfile: { findUnique: jest.fn() },
    workoutMovement: { findMany: jest.fn() },
    workoutMovementPrescription: { findMany: jest.fn() },
    movementResult: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingCalculatorsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(TrainingCalculatorsService);
    prismaMock.workoutMovement.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('calculates a workout target from the strongest exact rep max', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
      preferredWeightUnit: 'KG',
    });
    prismaMock.workoutMovementPrescription.findMany.mockResolvedValue([
      {
        id: 'prescription-1',
        workoutMovementId: 'workout-movement-1',
        prescriptionCategory: { key: 'MEN' },
        percentage: 75,
        referenceRepMax: 3,
        referenceMovement: { id: 'movement-1', name: 'Back Squat' },
      },
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      {
        movementId: 'movement-1',
        reps: 3,
        load: 120,
        weightUnit: 'KG',
        performedAt: new Date('2026-09-01T10:00:00.000Z'),
      },
      {
        movementId: 'movement-1',
        reps: 3,
        load: 275,
        weightUnit: 'LB',
        performedAt: new Date('2026-09-02T10:00:00.000Z'),
      },
    ]);

    const result = await service.getWorkoutTargets('user-1', 'workout-1');

    expect(result.targets[0].percentage).toBe(75);
    expect(result.targets[0].referenceRepMax).toBe(3);
    expect(result.targets[0].repMax?.load).toBe(124.5);
    expect(result.targets[0].repMax?.weightUnit).toBe('KG');
    expect(result.targets[0].target).toEqual({
      load: 93.5,
      weightUnit: 'KG',
    });
  });

  it('does not substitute a different rep max', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
      preferredWeightUnit: 'KG',
    });
    prismaMock.workoutMovementPrescription.findMany.mockResolvedValue([
      {
        id: 'prescription-1',
        workoutMovementId: 'workout-movement-1',
        prescriptionCategory: { key: 'MEN' },
        percentage: 80,
        referenceRepMax: 5,
        referenceMovement: { id: 'movement-1', name: 'Deadlift' },
      },
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([]);

    const result = await service.getWorkoutTargets('user-1', 'workout-1');

    expect(result.targets[0].repMax).toBeNull();
    expect(result.targets[0].target).toBeNull();
    const calls = prismaMock.movementResult.findMany.mock.calls as unknown[][];
    const query = calls[0][0] as {
      where: { OR: Array<{ movementId: string; reps: number }> };
    };
    expect(query.where.OR).toEqual([{ movementId: 'movement-1', reps: 5 }]);
  });

  it('calculates a generic movement target without a prescription category', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue({
      id: 'athlete-1',
      preferredWeightUnit: 'KG',
    });
    prismaMock.workoutMovementPrescription.findMany.mockResolvedValue([]);
    prismaMock.workoutMovement.findMany.mockResolvedValue([
      {
        id: 'workout-movement-1',
        movementId: 'movement-1',
        percentage: 70,
        referenceRepMax: 1,
        movement: { id: 'movement-1', name: 'Clean' },
      },
    ]);
    prismaMock.movementResult.findMany.mockResolvedValue([
      {
        movementId: 'movement-1',
        reps: 1,
        load: 100,
        weightUnit: 'KG',
        performedAt: new Date('2026-09-01T10:00:00.000Z'),
      },
    ]);

    const result = await service.getWorkoutTargets('user-1', 'workout-1');

    expect(result.targets[0]).toMatchObject({
      prescriptionId: null,
      workoutMovementId: 'workout-movement-1',
      prescriptionCategoryKey: '',
      percentage: 70,
      referenceRepMax: 1,
      target: { load: 70, weightUnit: 'KG' },
    });
  });

  it('rejects users without an athlete profile', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getWorkoutTargets('user-1', 'workout-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
