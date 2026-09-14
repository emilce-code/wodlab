import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { BoxesService } from './boxes.service';

describe('BoxesService', () => {
  let service: BoxesService;
  const transaction = {
    box: { create: jest.fn() },
    user: { update: jest.fn() },
    classSession: { findFirst: jest.fn() },
    classBooking: {
      count: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    box: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    boxMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    workout: { findMany: jest.fn(), findFirst: jest.fn() },
    classSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    classBooking: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      Promise.resolve(callback(transaction)),
    ),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoxesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(BoxesService);
    prisma.user.findUnique.mockResolvedValue({
      role: 'ADMIN',
      activeBoxId: 'box-1',
    });
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'user-1',
      role: 'ATHLETE',
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('returns the boxes joined by the user', async () => {
    prisma.boxMembership.findMany.mockResolvedValue([
      { role: 'ATHLETE', box: { id: 'box-1', name: 'Downtown' } },
    ]);
    await expect(service.findAll('user-1')).resolves.toEqual([
      { id: 'box-1', name: 'Downtown', role: 'ATHLETE', isActive: true },
    ]);
  });

  it('creates a box and owner membership', async () => {
    prisma.box.findUnique.mockResolvedValue(null);
    transaction.box.create.mockResolvedValue({ id: 'box-1' });
    await service.create('user-1', { name: 'Downtown' });
    expect(transaction.box.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: 'Downtown',
          ownerUserId: 'user-1',
          memberships: { create: { userId: 'user-1', role: 'OWNER' } },
        }),
      }),
    );
  });

  it('prevents non-administrators from creating a box', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });

    await expect(
      service.create('user-1', { name: 'Downtown' }),
    ).rejects.toThrow('Administrator access required');
  });

  it('allows a box owner to update box information', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'user-1',
      role: 'OWNER',
    });
    prisma.box.update.mockResolvedValue({ id: 'box-1', name: 'North Box' });

    await service.update('user-1', 'box-1', {
      name: ' North Box ',
      description: ' Strength and conditioning ',
    });

    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-1' },
      data: {
        name: 'North Box',
        description: 'Strength and conditioning',
      },
    });
  });

  it('allows an administrator to update any existing box', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.box.findUnique.mockResolvedValue({ id: 'box-2' });
    prisma.box.update.mockResolvedValue({ id: 'box-2' });

    await service.update('admin-1', 'box-2', { timezone: 'America/Asuncion' });

    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-2' },
      data: { timezone: 'America/Asuncion' },
    });
  });

  it('only activates a box joined by the user', async () => {
    await expect(service.setActiveBox('user-1', 'box-1')).resolves.toEqual({
      boxId: 'box-1',
      role: 'ATHLETE',
      active: true,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeBoxId: 'box-1' },
    });
  });

  it('does not allow athletes to create classes', async () => {
    await expect(
      service.createClass('user-1', 'box-1', {
        name: 'Morning class',
        startsAt: '2026-09-15T10:00:00.000Z',
        durationMinutes: 60,
        capacity: 12,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a variation without a workout', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'owner-1',
      role: 'OWNER',
    });
    await expect(
      service.createClass('owner-1', 'box-1', {
        name: 'Morning class',
        startsAt: '2026-09-15T10:00:00.000Z',
        durationMinutes: 60,
        capacity: 12,
        workoutVariantId: 'variant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents bookings when class capacity is reached', async () => {
    transaction.classSession.findFirst.mockResolvedValue({
      id: 'class-1',
      capacity: 1,
      startsAt: new Date('2099-01-01T10:00:00.000Z'),
    });
    transaction.classBooking.count.mockResolvedValue(1);
    transaction.classBooking.findUnique.mockResolvedValue(null);
    await expect(
      service.book('user-1', 'box-1', 'class-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('restores a cancelled booking when capacity is available', async () => {
    transaction.classSession.findFirst.mockResolvedValue({
      id: 'class-1',
      capacity: 12,
      startsAt: new Date('2099-01-01T10:00:00.000Z'),
    });
    transaction.classBooking.count.mockResolvedValue(1);
    transaction.classBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: 'CANCELLED',
    });
    transaction.classBooking.upsert.mockResolvedValue({
      id: 'booking-1',
      status: 'BOOKED',
    });
    await expect(
      service.book('user-1', 'box-1', 'class-1'),
    ).resolves.toMatchObject({ status: 'BOOKED' });
  });
});
