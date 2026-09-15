import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementsService } from './movements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MovementsService', () => {
  let service: MovementsService;

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

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    movement: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    movementCategory: {
      findUnique: jest.fn(),
    },
    measurementType: {
      findMany: jest.fn(),
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

  const movementFixture = ({
    id = 'movement-1',
    createdByUserId = 'user-1',
    official = false,
    scope = 'PERSONAL',
    boxId = null,
    box = null,
    description = null,
    translations = [],
  }: {
    id?: string;
    createdByUserId?: string;
    official?: boolean;
    scope?: 'GLOBAL' | 'BOX' | 'PERSONAL';
    boxId?: string | null;
    box?: { id: string; name: string } | null;
    description?: string | null;
    translations?: {
      locale: string;
      name: string | null;
      description: string;
    }[];
  } = {}) => ({
    id,
    name: 'Back Squat',
    aliases: [],
    isFoundational: true,
    official,
    description,
    translations,
    videoUrl: null,
    scope,
    boxId,
    box,
    createdByUserId,
    categoryId: 'category-1',
    category: {
      key: 'SQUAT',
      name: 'Squat',
    },
    measurementTypes: [
      {
        measurementTypeId: 'measurement-1',
        measurementType: {
          key: 'WEIGHT',
          name: 'Weight',
        },
      },
    ],
    _count: {
      workoutMovements: 0,
      movementResults: 0,
      percentagePrescriptions: 0,
      variants: 0,
    },
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MovementsService>(MovementsService);

    prisma.user.findUnique.mockResolvedValue(userContext());
    prisma.movement.findMany.mockResolvedValue([]);
    prisma.movement.count.mockResolvedValue(0);
    prisma.movement.findUnique.mockResolvedValue(null);
    prisma.movement.create.mockResolvedValue(movementFixture());
    prisma.movementCategory.findUnique.mockResolvedValue({
      id: 'category-1',
    });
    prisma.measurementType.findMany.mockResolvedValue([
      {
        id: 'measurement-1',
      },
    ]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('paginates movement searches at the database', async () => {
    prisma.movement.count.mockResolvedValue(14);

    await expect(
      service.findAll(
        {
          search: 'squat',
          page: 2,
          pageSize: 10,
        },
        user,
      ),
    ).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 10,
      total: 14,
      totalPages: 2,
      hasNextPage: false,
    });

    expect(prisma.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it('returns the requested Spanish movement translation', async () => {
    prisma.movement.findMany.mockResolvedValue([
      movementFixture({
        description: 'Legacy description',
        translations: [
          {
            locale: 'en',
            name: null,
            description: 'English description',
          },
          {
            locale: 'es',
            name: 'Sentadilla trasera',
            description: 'Descripción en español',
          },
        ],
      }),
    ]);

    const result = await service.findAll({}, user, 'es-PY,es;q=0.9,en;q=0.8');

    expect(result).toEqual([
      expect.objectContaining({
        name: 'Sentadilla trasera',
        description: 'Descripción en español',
      }),
    ]);
  });

  it('uses English when the requested translation is unavailable', async () => {
    prisma.movement.findUnique.mockResolvedValue(
      movementFixture({
        description: 'Legacy description',
        translations: [
          {
            locale: 'en',
            name: null,
            description: 'English description',
          },
        ],
      }),
    );

    await expect(service.findOne('movement-1', user, 'pt-BR')).resolves.toEqual(
      expect.objectContaining({
        name: 'Back Squat',
        description: 'English description',
      }),
    );
  });

  it('uses the legacy description when no translations exist', async () => {
    prisma.movement.findUnique.mockResolvedValue(
      movementFixture({ description: 'Custom movement description' }),
    );

    await expect(service.findOne('movement-1', user, 'pt-BR')).resolves.toEqual(
      expect.objectContaining({
        description: 'Custom movement description',
      }),
    );
  });

  it('lists GLOBAL plus the current user PERSONAL movements when no Box is active', async () => {
    await service.findAll({}, user);

    expect(prisma.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { scope: 'GLOBAL' },
                { id: '__never__' },
                {
                  scope: 'PERSONAL',
                  createdByUserId: 'user-1',
                },
              ],
            },
            {},
          ],
        },
      }),
    );
  });

  it('includes only the active Box in Box-scoped movement visibility', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    await service.findAll({ scope: 'box' }, user);

    expect(prisma.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              scope: 'BOX',
              boxId: 'box-1',
            },
            {},
          ],
        },
      }),
    );
  });

  it('filters the movement library to the current user PERSONAL movements', async () => {
    await service.findAll({ scope: 'personal' }, user);

    expect(prisma.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              scope: 'PERSONAL',
              createdByUserId: 'user-1',
            },
            {},
          ],
        },
      }),
    );
  });

  it('creates athlete movements as PERSONAL even when an athlete Box is active', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prisma.movement.create.mockResolvedValue(
      movementFixture({
        scope: 'PERSONAL',
      }),
    );

    await service.create(user, {
      name: 'Back Squat',
      categoryKey: 'SQUAT',
      measurementTypeKeys: ['WEIGHT'],
    });

    expect(prisma.movement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: 'PERSONAL',
          boxId: null,
          createdByUserId: 'user-1',
        }),
      }),
    );
  });

  it.each(['OWNER', 'COACH'] as const)(
    'creates movements as BOX for an active Box %s',
    async (activeBoxRole) => {
      prisma.user.findUnique.mockResolvedValue(
        userContext({
          activeBoxId: 'box-1',
          activeBoxRole,
        }),
      );

      prisma.movement.create.mockResolvedValue(
        movementFixture({
          scope: 'BOX',
          boxId: 'box-1',
          box: {
            id: 'box-1',
            name: 'Wodlab CrossFit',
          },
        }),
      );

      await service.create(user, {
        name: 'Back Squat',
        categoryKey: 'SQUAT',
        measurementTypeKeys: ['WEIGHT'],
      });

      expect(prisma.movement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scope: 'BOX',
            boxId: 'box-1',
            createdByUserId: 'user-1',
          }),
        }),
      );
    },
  );

  it('creates ADMIN movements as BOX when the Admin has an active Box', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        role: 'ADMIN',
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prisma.movement.create.mockResolvedValue(
      movementFixture({
        createdByUserId: 'admin-1',
        scope: 'BOX',
        boxId: 'box-1',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
      }),
    );

    await service.create(admin, {
      name: 'Back Squat',
      categoryKey: 'SQUAT',
      measurementTypeKeys: ['WEIGHT'],
    });

    expect(prisma.movement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: 'BOX',
          boxId: 'box-1',
          createdByUserId: 'admin-1',
        }),
      }),
    );
  });

  it('creates ADMIN movements as GLOBAL when there is no active Box', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        role: 'ADMIN',
      }),
    );

    prisma.movement.create.mockResolvedValue(
      movementFixture({
        createdByUserId: 'admin-1',
        official: false,
        scope: 'GLOBAL',
      }),
    );

    await service.create(admin, {
      name: 'Back Squat',
      categoryKey: 'SQUAT',
      measurementTypeKeys: ['WEIGHT'],
    });

    expect(prisma.movement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: 'GLOBAL',
          boxId: null,
          createdByUserId: 'admin-1',
        }),
      }),
    );
  });

  it('prevents direct-ID access to a PERSONAL movement owned by another user', async () => {
    prisma.movement.findUnique.mockResolvedValue(
      movementFixture({
        createdByUserId: 'user-2',
        scope: 'PERSONAL',
      }),
    );

    await expect(
      service.findOne('movement-1', user),
    ).rejects.toThrow(new NotFoundException('Movement not found'));
  });

  it('prevents direct-ID access to a movement belonging to another Box', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prisma.movement.findUnique.mockResolvedValue(
      movementFixture({
        createdByUserId: 'coach-2',
        scope: 'BOX',
        boxId: 'box-2',
        box: {
          id: 'box-2',
          name: 'Other Box',
        },
      }),
    );

    await expect(
      service.findOne('movement-1', user),
    ).rejects.toThrow(new NotFoundException('Movement not found'));
  });

  it('allows direct-ID access to a movement in the active Box', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userContext({
        activeBoxId: 'box-1',
        activeBoxRole: 'ATHLETE',
      }),
    );

    prisma.movement.findUnique.mockResolvedValue(
      movementFixture({
        createdByUserId: 'coach-1',
        scope: 'BOX',
        boxId: 'box-1',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
      }),
    );

    await expect(
      service.findOne('movement-1', user),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'movement-1',
        scope: 'BOX',
        box: {
          id: 'box-1',
          name: 'Wodlab CrossFit',
        },
      }),
    );
  });

  it('deletes an unused custom movement owned by the user', async () => {
    prisma.movement.findUnique
      .mockResolvedValueOnce({
        id: 'movement-1',
        name: 'Custom movement',
        aliases: [],
        official: false,
        createdByUserId: 'user-1',
        categoryId: 'category-1',
        measurementTypes: [],
      })
      .mockResolvedValueOnce({
        _count: {
          workoutMovements: 0,
          movementResults: 0,
          percentagePrescriptions: 0,
          variants: 0,
        },
      });

    await expect(
      service.delete('movement-1', user),
    ).resolves.toEqual({
      id: 'movement-1',
      deleted: true,
    });

    expect(prisma.movement.delete).toHaveBeenCalledWith({
      where: {
        id: 'movement-1',
      },
    });
  });

  it('rejects deleting a movement owned by another user', async () => {
    prisma.movement.findUnique.mockResolvedValueOnce({
      id: 'movement-1',
      name: 'Custom movement',
      aliases: [],
      official: false,
      createdByUserId: 'user-2',
      categoryId: 'category-1',
      measurementTypes: [],
    });

    await expect(
      service.delete('movement-1', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects deleting a movement used by a workout', async () => {
    prisma.movement.findUnique
      .mockResolvedValueOnce({
        id: 'movement-1',
        name: 'Custom movement',
        aliases: [],
        official: false,
        createdByUserId: 'user-1',
        categoryId: 'category-1',
        measurementTypes: [],
      })
      .mockResolvedValueOnce({
        _count: {
          workoutMovements: 1,
          movementResults: 0,
          percentagePrescriptions: 0,
          variants: 0,
        },
      });

    await expect(
      service.delete('movement-1', user),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
