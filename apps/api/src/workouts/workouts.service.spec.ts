import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsService lifecycle and catalog scope', () => {
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
    user: {
      findUnique: jest.fn(),
    },
    workout: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workoutResult: {
      findFirst: jest.fn(),
    },
  };

  const userContext = ({
    role = 'USER',
    activeBoxId = null,
    activeBoxRole = null,
  }: {
    role?: 'USER' | 'COACH' | 'ADMIN';
    activeBoxId?: string | null;
    activeBoxRole?: 'OWNER' | 'COACH' | 'ATHLETE' | null;
  } = {}) => ({
    id: role === 'ADMIN' ? 'admin-1' : 'user-1',
    role,
    activeBoxId,
    boxMemberships:
      activeBoxId && activeBoxRole
        ? [
            {
              boxId: activeBoxId,
              role: activeBoxRole,
            },
          ]
        : [],
  });

  const workoutFixture = ({
    isActive = true,
    resultCount = 0,
    scheduledWorkoutCount = 0,
    programTemplateItemCount = 0,
    classSessionCount = 0,
    createdByUserId = 'user-1',
    official = false,
    scope = 'PERSONAL',
    boxId = null,
    box = null,
    sourceWorkoutId = null,
    sourceWorkout = null,
  }: {
    isActive?: boolean;
    resultCount?: number;
    scheduledWorkoutCount?: number;
    programTemplateItemCount?: number;
    classSessionCount?: number;
    createdByUserId?: string;
    official?: boolean;
    scope?: 'GLOBAL' | 'BOX' | 'PERSONAL';
    boxId?: string | null;
    box?: { id: string; name: string } | null;
    sourceWorkoutId?: string | null;
    sourceWorkout?: { id: string; name: string } | null;
  } = {}) => ({
    id: 'workout-1',
    name: 'Fran',
    description: null,
    typeId: 'type-1',
    createdByUserId,
    isBenchmark: true,
    official,
    scope,
    boxId,
    sourceWorkoutId,
    isActive,
    deactivatedAt: isActive ? null : new Date('2026-09-02T12:00:00.000Z'),
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-02T12:00:00.000Z'),
    type: {
      key: 'FOR_TIME',
      name: 'For Time',
      defaultResultType: {
        key: 'TIME',
        name: 'Time',
      },
    },
    createdByUser: {
      id: createdByUserId,
      email: 'creator@example.com',
    },
    box,
    sourceWorkout,
    variants: [],
    _count: {
      results: resultCount,
      scheduledWorkouts: scheduledWorkoutCount,
      programTemplateItems: programTemplateItemCount,
      classSessions: classSessionCount,
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(WorkoutsService);

    prismaMock.user.findUnique.mockResolvedValue(userContext());

    prismaMock.workout.findMany.mockResolvedValue([]);
    prismaMock.workout.count.mockResolvedValue(0);
    prismaMock.workout.findUnique.mockResolvedValue(null);
    prismaMock.workout.update.mockResolvedValue(null);
    prismaMock.workout.delete.mockResolvedValue({
      id: 'workout-1',
    });

    prismaMock.workoutResult.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists only active workouts visible to the current catalog context', async () => {
    await service.findAll(user);

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  scope: 'GLOBAL',
                }),
                expect.objectContaining({
                  scope: 'PERSONAL',
                  createdByUserId: user.userId,
                }),
              ]),
            }),
            expect.objectContaining({
              isActive: true,
            }),
          ]),
        }),
        orderBy: [{ createdAt: 'desc' }],
      }),
    );
  });

  it('includes only the active Box when filtering the workout library by Box', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    await service.findAll(user, { scope: 'box' });

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              scope: 'BOX',
              boxId: 'box-1',
            },
            {
              isActive: true,
            },
          ]),
        }),
      }),
    );
  });

  it('filters the workout library to the current user PERSONAL workouts', async () => {
    await service.findAll(user, { scope: 'personal' });

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              scope: 'PERSONAL',
              createdByUserId: 'user-1',
            },
            {
              isActive: true,
            },
          ]),
        }),
      }),
    );
  });

  it('returns pagination metadata and applies database limits', async () => {
    prismaMock.workout.count.mockResolvedValue(25);

    await expect(
      service.findAll(user, {
        page: 2,
        pageSize: 10,
        search: 'Fran',
      }),
    ).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
    });

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );

    expect(prismaMock.workout.count).toHaveBeenCalledTimes(1);
  });

  it('lists only archived workouts visible to the current user', async () => {
    await service.findArchived(user);

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  scope: 'PERSONAL',
                  createdByUserId: user.userId,
                }),
              ]),
            }),
            expect.objectContaining({
              isActive: false,
            }),
          ]),
        }),
        orderBy: [
          { deactivatedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
    );
  });

  describe('Phase 48B creation scope', () => {
    type CatalogContext = {
      userId: string;
      appRole: 'USER' | 'COACH' | 'ADMIN';
      activeBoxId: string | null;
      activeBoxName: string | null;
      activeBoxRole: 'OWNER' | 'COACH' | 'ATHLETE' | null;
    };

    const resolveCreationScope = (context: CatalogContext) =>
      (
        service as unknown as {
          resolveCreationScope: (value: CatalogContext) => {
            scope: 'GLOBAL' | 'BOX' | 'PERSONAL';
            boxId: string | null;
          };
        }
      ).resolveCreationScope(context);

    it('creates athlete workouts as PERSONAL even with an active Box', () => {
      expect(
        resolveCreationScope({
          userId: 'user-1',
          appRole: 'USER',
          activeBoxId: 'box-1',
          activeBoxName: 'Wodlab CrossFit',
          activeBoxRole: 'ATHLETE',
        }),
      ).toEqual({
        scope: 'PERSONAL',
        boxId: null,
      });
    });

    it.each(['OWNER', 'COACH'] as const)(
      'creates workouts as BOX for an active Box %s',
      (activeBoxRole) => {
        expect(
          resolveCreationScope({
            userId: 'user-1',
            appRole: 'USER',
            activeBoxId: 'box-1',
            activeBoxName: 'Wodlab CrossFit',
            activeBoxRole,
          }),
        ).toEqual({
          scope: 'BOX',
          boxId: 'box-1',
        });
      },
    );

    it('creates ADMIN workouts as BOX when an active Box is selected', () => {
      expect(
        resolveCreationScope({
          userId: 'admin-1',
          appRole: 'ADMIN',
          activeBoxId: 'box-1',
          activeBoxName: 'Wodlab CrossFit',
          activeBoxRole: 'ATHLETE',
        }),
      ).toEqual({
        scope: 'BOX',
        boxId: 'box-1',
      });
    });

    it('creates ADMIN workouts as GLOBAL without an active Box', () => {
      expect(
        resolveCreationScope({
          userId: 'admin-1',
          appRole: 'ADMIN',
          activeBoxId: null,
          activeBoxName: null,
          activeBoxRole: null,
        }),
      ).toEqual({
        scope: 'GLOBAL',
        boxId: null,
      });
    });
  });

  it('allows the creator to read an inactive PERSONAL workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        isActive: false,
      }),
    );

    await expect(
      service.findOne('workout-1', user),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'workout-1',
        isActive: false,
        scope: 'PERSONAL',
      }),
    );
  });

  it('allows an athlete with history to read an inactive workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        isActive: false,
        createdByUserId: 'creator-2',
      }),
    );

    prismaMock.workoutResult.findFirst.mockResolvedValue({
      id: 'result-1',
    });

    await expect(
      service.findOne('workout-1', user),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'workout-1',
        isActive: false,
      }),
    );
  });

  it('hides inactive workouts from unrelated athletes', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        isActive: false,
        createdByUserId: 'creator-2',
      }),
    );

    await expect(
      service.findOne('workout-1', user),
    ).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
  });

  it('prevents direct-ID access to another user PERSONAL workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        createdByUserId: 'creator-2',
        scope: 'PERSONAL',
      }),
    );

    await expect(
      service.findOne('workout-1', user),
    ).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
  });

  it('prevents access to a workout belonging to another Box through its identifier', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        scope: 'BOX',
        boxId: 'box-2',
        box: {
          id: 'box-2',
          name: 'Other Box',
        },
        createdByUserId: 'coach-2',
      }),
    );

    await expect(
      service.findOne('workout-1', user),
    ).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
  });

  it('allows an athlete to read an active workout from the active Box', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        scope: 'BOX',
        boxId: 'box-1',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
        createdByUserId: 'coach-1',
      }),
    );

    await expect(
      service.findOne('workout-1', user),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'workout-1',
        scope: 'BOX',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
      }),
    );
  });

  it('permanently deletes an owned PERSONAL workout without dependencies', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture(),
    );

    await expect(
      service.delete(user, 'workout-1'),
    ).resolves.toEqual({
      id: 'workout-1',
      deleted: true,
    });

    expect(prismaMock.workout.delete).toHaveBeenCalledWith({
      where: {
        id: 'workout-1',
      },
    });
  });

  it('blocks permanent deletion when dependencies exist', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        resultCount: 2,
      }),
    );

    await expect(
      service.delete(user, 'workout-1'),
    ).rejects.toThrow(ConflictException);

    expect(
      prismaMock.workout.delete,
    ).not.toHaveBeenCalled();
  });

  it('blocks lifecycle actions on another user PERSONAL workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        createdByUserId: 'creator-2',
      }),
    );

    await expect(
      service.delete(user, 'workout-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an owned workout to be archived even without dependencies', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture(),
    );

    prismaMock.workout.update.mockResolvedValue(
      workoutFixture({
        isActive: false,
      }),
    );

    const result = await service.deactivate(
      user,
      'workout-1',
    );

    expect(result.isActive).toBe(false);

    const updateCalls =
      prismaMock.workout.update.mock.calls as unknown[][];

    const updateInput = updateCalls[0][0] as {
      where: {
        id: string;
      };
      data: {
        isActive: boolean;
        deactivatedAt: unknown;
      };
    };

    expect(updateInput.where).toEqual({
      id: 'workout-1',
    });

    expect(updateInput.data.isActive).toBe(false);

    expect(
      updateInput.data.deactivatedAt,
    ).toBeInstanceOf(Date);
  });

  it('reactivates an owned inactive PERSONAL workout', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        isActive: false,
        resultCount: 2,
      }),
    );

    prismaMock.workout.update.mockResolvedValue(
      workoutFixture({
        isActive: true,
        resultCount: 2,
      }),
    );

    const result = await service.reactivate(
      user,
      'workout-1',
    );

    expect(result.isActive).toBe(true);

    expect(
      prismaMock.workout.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'workout-1',
        },
        data: {
          isActive: true,
          deactivatedAt: null,
        },
      }),
    );
  });

  it('blocks regular users from managing GLOBAL workouts', async () => {
    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        official: true,
        scope: 'GLOBAL',
        createdByUserId: 'seed-user',
      }),
    );

    await expect(
      service.delete(user, 'workout-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows administrators to manage GLOBAL workouts', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userContext({
        role: 'ADMIN',
      }),
    );

    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        official: true,
        scope: 'GLOBAL',
        createdByUserId: 'seed-user',
      }),
    );

    await expect(
      service.delete(admin, 'workout-1'),
    ).resolves.toEqual({
      id: 'workout-1',
      deleted: true,
    });
  });

  it('allows an active Box coach to manage a workout owned by that Box', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userContext({
        role: 'COACH',
        activeBoxId: 'box-1',
        activeBoxRole: 'COACH',
      }),
    );

    prismaMock.workout.findUnique.mockResolvedValue(
      workoutFixture({
        scope: 'BOX',
        boxId: 'box-1',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
        createdByUserId: 'another-coach',
      }),
    );

    await expect(
      service.delete(
        {
          userId: 'user-1',
          email: 'user@example.com',
          role: 'COACH',
        },
        'workout-1',
      ),
    ).resolves.toEqual({
      id: 'workout-1',
      deleted: true,
    });
  });
});
