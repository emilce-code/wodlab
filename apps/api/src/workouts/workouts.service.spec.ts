import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsService lifecycle', () => {
  let service: WorkoutsService;
  const user = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'USER' as const,
  };
  const admin = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
  };

  const prismaMock = {
    workout: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workoutResult: { findFirst: jest.fn() },
  };

  const workoutFixture = ({
    isActive = true,
    resultCount = 0,
    createdByUserId = 'user-1',
    official = false,
  }: {
    isActive?: boolean;
    resultCount?: number;
    createdByUserId?: string;
    official?: boolean;
  } = {}) => ({
    id: 'workout-1',
    name: 'Fran',
    description: null,
    typeId: 'type-1',
    createdByUserId,
    isBenchmark: true,
    official,
    isActive,
    deactivatedAt: isActive ? null : new Date('2026-09-02T12:00:00.000Z'),
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-02T12:00:00.000Z'),
    type: {
      key: 'FOR_TIME',
      name: 'For Time',
      defaultResultType: { key: 'TIME', name: 'Time' },
    },
    createdByUser: {
      id: createdByUserId,
      email: 'creator@example.com',
    },
    variants: [],
    _count: {
      results: resultCount,
      scheduledWorkouts: 0,
      programTemplateItems: 0,
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(WorkoutsService);
    prismaMock.workout.findMany.mockResolvedValue([]);
    prismaMock.workout.count.mockResolvedValue(0);
    prismaMock.workout.findUnique.mockResolvedValue(null);
    prismaMock.workoutResult.findFirst.mockResolvedValue(null);
    prismaMock.workout.delete.mockResolvedValue({ id: 'workout-1' });
  });

  afterEach(() => jest.clearAllMocks());

  it('lists only active workouts', async () => {
    await service.findAll(user);
    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('returns pagination metadata and applies database limits', async () => {
    prismaMock.workout.count.mockResolvedValue(25);

    await expect(
      service.findAll(user, { page: 2, pageSize: 10, search: 'Fran' }),
    ).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
    });
    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(prismaMock.workout.count).toHaveBeenCalledTimes(1);
  });

  it('lists only archived workouts created by the current user', async () => {
    await service.findArchived(user);
    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdByUserId: 'user-1', isActive: false },
        orderBy: [{ deactivatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  });

  it('allows the creator to read an inactive workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ isActive: false }),
    );
    await expect(service.findOne('workout-1', user)).resolves.toEqual(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('allows an athlete with history to read an inactive workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ isActive: false, createdByUserId: 'creator-2' }),
    );
    prismaMock.workoutResult.findFirst.mockResolvedValue({ id: 'result-1' });
    await expect(service.findOne('workout-1', user)).resolves.toEqual(
      expect.objectContaining({ id: 'workout-1', isActive: false }),
    );
  });

  it('hides inactive workouts from unrelated athletes', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ isActive: false, createdByUserId: 'creator-2' }),
    );
    await expect(service.findOne('workout-1', user)).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
  });

  it('permanently deletes an owned workout without results', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(workoutFixture());
    await expect(service.delete(user, 'workout-1')).resolves.toEqual({
      id: 'workout-1',
      deleted: true,
    });
    expect(prismaMock.workout.delete).toHaveBeenCalledWith({
      where: { id: 'workout-1' },
    });
  });

  it('blocks permanent deletion when results exist', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ resultCount: 2 }),
    );
    await expect(service.delete(user, 'workout-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prismaMock.workout.delete).not.toHaveBeenCalled();
  });

  it('blocks lifecycle actions by users other than the creator', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ createdByUserId: 'creator-2' }),
    );
    await expect(service.delete(user, 'workout-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deactivates an owned workout with results', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ resultCount: 2 }),
    );
    prismaMock.workout.update.mockResolvedValue(
      workoutFixture({ isActive: false, resultCount: 2 }),
    );
    const result = await service.deactivate(user, 'workout-1');
    expect(result.isActive).toBe(false);
    const updateCalls = prismaMock.workout.update.mock.calls as unknown[][];
    const updateInput = updateCalls[0][0] as {
      where: { id: string };
      data: { isActive: boolean; deactivatedAt: unknown };
    };
    expect(updateInput.where).toEqual({ id: 'workout-1' });
    expect(updateInput.data.isActive).toBe(false);
    expect(updateInput.data.deactivatedAt).toBeInstanceOf(Date);
  });

  it('requires empty workouts to be deleted instead of deactivated', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(workoutFixture());
    await expect(service.deactivate(user, 'workout-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('reactivates an owned inactive workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ isActive: false, resultCount: 2 }),
    );
    prismaMock.workout.update.mockResolvedValue(
      workoutFixture({ isActive: true, resultCount: 2 }),
    );
    const result = await service.reactivate(user, 'workout-1');
    expect(result.isActive).toBe(true);
    expect(prismaMock.workout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'workout-1' },
        data: { isActive: true, deactivatedAt: null },
      }),
    );
  });

  it('blocks regular users from managing official workouts', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ official: true }),
    );
    await expect(service.delete(user, 'workout-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows administrators to manage official workouts', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({ official: true, createdByUserId: 'seed-user' }),
    );
    await expect(service.delete(admin, 'workout-1')).resolves.toEqual({
      id: 'workout-1',
      deleted: true,
    });
  });
});
