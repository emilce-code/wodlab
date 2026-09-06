import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ScheduledWorkoutStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';

describe('ScheduledWorkoutsService', () => {
  let service: ScheduledWorkoutsService;

  const prismaMock = {
    athleteProfile: { findUnique: jest.fn() },
    workout: { findFirst: jest.fn() },
    workoutVariant: { findFirst: jest.fn() },
    prescriptionCategory: { findUnique: jest.fn() },
    scheduledWorkout: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledWorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ScheduledWorkoutsService);

    prismaMock.athleteProfile.findUnique.mockResolvedValue({ id: 'athlete-1' });
    prismaMock.workout.findFirst.mockResolvedValue({ id: 'workout-1' });
    prismaMock.workoutVariant.findFirst.mockResolvedValue({ id: 'variant-1' });
    prismaMock.prescriptionCategory.findUnique.mockResolvedValue({
      id: 'prescription-1',
    });
    prismaMock.scheduledWorkout.create.mockResolvedValue({ id: 'scheduled-1' });
    prismaMock.scheduledWorkout.count.mockResolvedValue(0);
    prismaMock.scheduledWorkout.findMany.mockResolvedValue([]);
    prismaMock.scheduledWorkout.findFirst.mockResolvedValue({
      id: 'scheduled-1',
      workoutId: 'workout-1',
      workoutVariantId: 'variant-1',
      status: ScheduledWorkoutStatus.PLANNED,
    });
    prismaMock.scheduledWorkout.update.mockResolvedValue({
      id: 'scheduled-1',
    });
    prismaMock.scheduledWorkout.delete.mockResolvedValue({
      id: 'scheduled-1',
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('creates a planned workout for the authenticated athlete', async () => {
    await service.create('user-1', {
      workoutId: 'workout-1',
      workoutVariantId: 'variant-1',
      prescriptionCategoryKey: 'RX',
      scheduledDate: '2026-09-07',
      notes: '  Morning session  ',
    });

    expect(prismaMock.scheduledWorkout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          athleteProfileId: 'athlete-1',
          workoutId: 'workout-1',
          workoutVariantId: 'variant-1',
          prescriptionCategoryId: 'prescription-1',
          scheduledDate: new Date('2026-09-07T00:00:00.000Z'),
          notes: 'Morning session',
        },
      }),
    );
  });

  it('rejects scheduling when the athlete profile does not exist', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        workoutId: 'workout-1',
        workoutVariantId: 'variant-1',
        scheduledDate: '2026-09-07',
      }),
    ).rejects.toThrow(new NotFoundException('Athlete profile not found'));
  });

  it('rejects inactive or missing workouts', async () => {
    prismaMock.workout.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        workoutId: 'workout-1',
        workoutVariantId: 'variant-1',
        scheduledDate: '2026-09-07',
      }),
    ).rejects.toThrow(new NotFoundException('Workout not found'));
  });

  it('rejects a variation from another workout', async () => {
    prismaMock.workoutVariant.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        workoutId: 'workout-1',
        workoutVariantId: 'variant-2',
        scheduledDate: '2026-09-07',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects the same variation scheduled twice on the same date', async () => {
    prismaMock.scheduledWorkout.count.mockResolvedValue(1);

    await expect(
      service.create('user-1', {
        workoutId: 'workout-1',
        workoutVariantId: 'variant-1',
        scheduledDate: '2026-09-07',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'This workout variation is already scheduled for that date',
      ),
    );
    expect(prismaMock.scheduledWorkout.create).not.toHaveBeenCalled();
  });

  it('lists the athlete schedule using date and status filters', async () => {
    await service.findAll('user-1', {
      from: '2026-09-07',
      to: '2026-09-14',
      status: ScheduledWorkoutStatus.PLANNED,
    });

    expect(prismaMock.scheduledWorkout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          athleteProfileId: 'athlete-1',
          status: ScheduledWorkoutStatus.PLANNED,
          scheduledDate: {
            gte: new Date('2026-09-07T00:00:00.000Z'),
            lte: new Date('2026-09-14T00:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('rejects an inverted date range', async () => {
    await expect(
      service.findAll('user-1', {
        from: '2026-09-14',
        to: '2026-09-07',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('reschedules an owned workout', async () => {
    await service.update('user-1', 'scheduled-1', {
      scheduledDate: '2026-09-10',
      notes: '  Evening  ',
    });

    expect(prismaMock.scheduledWorkout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'scheduled-1' },
        data: expect.objectContaining({
          scheduledDate: new Date('2026-09-10T00:00:00.000Z'),
          notes: 'Evening',
        }) as unknown,
      }),
    );
  });

  it('clears the prescription category and notes', async () => {
    await service.update('user-1', 'scheduled-1', {
      prescriptionCategoryKey: null,
      notes: null,
    });

    expect(prismaMock.scheduledWorkout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          prescriptionCategoryId: null,
          notes: null,
        }) as unknown,
      }),
    );
  });

  it('does not expose another athlete scheduled workout', async () => {
    prismaMock.scheduledWorkout.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'scheduled-2', {
        scheduledDate: '2026-09-10',
      }),
    ).rejects.toThrow(new NotFoundException('Scheduled workout not found'));
  });

  it('removes an owned planned workout', async () => {
    await expect(service.remove('user-1', 'scheduled-1')).resolves.toEqual({
      id: 'scheduled-1',
      deleted: true,
    });
    expect(prismaMock.scheduledWorkout.delete).toHaveBeenCalledWith({
      where: { id: 'scheduled-1' },
    });
  });

  it('preserves completed scheduled workouts as history', async () => {
    prismaMock.scheduledWorkout.findFirst.mockResolvedValue({
      id: 'scheduled-1',
      workoutId: 'workout-1',
      workoutVariantId: 'variant-1',
      status: ScheduledWorkoutStatus.COMPLETED,
    });

    await expect(service.remove('user-1', 'scheduled-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prismaMock.scheduledWorkout.delete).not.toHaveBeenCalled();
  });
});
