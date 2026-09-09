import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementsService } from './movements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MovementsService', () => {
  let service: MovementsService;
  const prisma = {
    movement: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      service.delete('movement-1', {
        userId: 'user-1',
        email: 'owner@example.com',
      }),
    ).resolves.toEqual({ id: 'movement-1', deleted: true });
    expect(prisma.movement.delete).toHaveBeenCalledWith({
      where: { id: 'movement-1' },
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
      service.delete('movement-1', {
        userId: 'user-1',
        email: 'other@example.com',
      }),
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
      service.delete('movement-1', {
        userId: 'user-1',
        email: 'owner@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
