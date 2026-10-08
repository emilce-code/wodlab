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
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    box: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    boxOrganization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    boxMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    workout: { findMany: jest.fn(), findFirst: jest.fn() },
    classSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    classBooking: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((operation: unknown) =>
      Promise.resolve(
        typeof operation === 'function'
          ? (operation as (client: typeof transaction) => unknown)(transaction)
          : operation,
      ),
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
      status: 'ACTIVE',
      role: { key: 'ATHLETE' },
    });
    prisma.box.findUniqueOrThrow.mockResolvedValue({ ownerUserId: 'owner-1' });
  });

  afterEach(() => jest.clearAllMocks());

  it('returns the boxes joined by the user', async () => {
    prisma.boxMembership.findMany.mockResolvedValue([
      {
        role: { key: 'ATHLETE' },
        box: { id: 'box-1', name: 'Downtown', ownerUserId: 'owner-1' },
      },
    ]);
    await expect(service.findAll('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'box-1',
        name: 'Downtown',
        role: 'ATHLETE',
        isActive: true,
      }),
    ]);
  });

  it('creates a box and owner membership', async () => {
    prisma.box.findUnique.mockResolvedValue(null);
    transaction.box.create.mockResolvedValue({ id: 'box-1' });
    await service.create('user-1', {
      name: 'Downtown',
      location: 'Old location field',
      latitude: -25.2867,
      longitude: -57.3333,
      supportContact: ' WhatsApp +595 981 000000 ',
    });
    expect(transaction.box.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: 'Downtown',
          address: 'Old location field',
          latitude: -25.2867,
          longitude: -57.3333,
          supportContact: 'WhatsApp +595 981 000000',
          ownerUserId: 'user-1',
          memberships: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            create: expect.objectContaining({
              userId: 'user-1',
              roleId: 'box-membership-role-owner',
              status: 'ACTIVE',
            }),
          },
        }),
      }),
    );
  });

  it('creates a box organization for administrators', async () => {
    prisma.boxOrganization.create.mockResolvedValue({
      id: 'org-1',
      name: 'WODLY Group',
    });

    await service.createOrganization('user-1', {
      name: ' WODLY Group ',
      description: ' Multi location ',
    });

    expect(prisma.boxOrganization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: 'WODLY Group',
          description: 'Multi location',
          owners: {
            create: { userId: 'user-1' },
          },
        }),
      }),
    );
  });

  it('prevents non-administrators from creating a box organization', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });

    await expect(
      service.createOrganization('user-1', { name: 'WODLY Group' }),
    ).rejects.toThrow('Administrator access required');
  });

  it('associates a new box to an existing organization', async () => {
    prisma.boxOrganization.findUnique.mockResolvedValue({ id: 'org-1' });
    transaction.box.create.mockResolvedValue({ id: 'box-1' });

    await service.create('user-1', {
      name: 'Downtown',
      organizationId: 'org-1',
    });

    expect(transaction.box.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          organizationId: 'org-1',
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
      status: 'ACTIVE',
      role: { key: 'OWNER' },
    });
    prisma.box.update.mockResolvedValue({ id: 'box-1', name: 'North Box' });

    await service.update('user-1', 'box-1', {
      name: ' North Box ',
      description: ' Strength and conditioning ',
      address: ' Av. Siempre Viva 123 ',
      supportContact: ' soporte@box.test ',
    });

    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-1' },
      data: {
        name: 'North Box',
        description: 'Strength and conditioning',
        address: 'Av. Siempre Viva 123',
        supportContact: 'soporte@box.test',
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

  it('reports the owner role when the owner views class sessions', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'owner-1',
      status: 'ACTIVE',
      role: { key: 'OWNER' },
    });
    prisma.classSession.findMany.mockResolvedValue([
      {
        id: 'class-1',
        bookings: [],
      },
    ]);

    await expect(
      service.findClasses('owner-1', 'box-1', {}),
    ).resolves.toMatchObject({
      role: 'OWNER',
      classes: [{ id: 'class-1', bookedCount: 0, currentUserBooking: null }],
    });
  });

  it('does not allow athletes to create classes', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    await expect(
      service.createClass('user-1', 'box-1', {
        name: 'Morning class',
        startsAt: '2099-09-15T10:00:00.000Z',
        durationMinutes: 60,
        capacity: 12,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows coaches to create classes', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'coach-1',
      status: 'ACTIVE',
      role: { key: 'COACH' },
    });
    prisma.box.findUniqueOrThrow.mockResolvedValue({ ownerUserId: 'owner-1' });
    prisma.classSession.create.mockResolvedValue({ id: 'class-1' });

    await expect(
      service.createClass('coach-1', 'box-1', {
        name: 'Evening class',
        startsAt: '2099-09-15T22:00:00.000Z',
        durationMinutes: 60,
        capacity: 12,
      }),
    ).resolves.toEqual({ id: 'class-1' });
  });

  it('rejects a variation without a workout', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'owner-1',
      status: 'ACTIVE',
      role: { key: 'OWNER' },
    });
    await expect(
      service.createClass('owner-1', 'box-1', {
        name: 'Morning class',
        startsAt: '2099-09-15T10:00:00.000Z',
        durationMinutes: 60,
        capacity: 12,
        workoutVariantId: 'variant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows coaches to update workout and notes after athletes booked', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'coach-1',
      status: 'ACTIVE',
      role: { key: 'COACH' },
    });
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'class-1',
      workoutId: null,
      workoutVariantId: null,
      bookings: [{ id: 'booking-1' }],
    });
    prisma.workout.findFirst.mockResolvedValue({ id: 'workout-1' });
    prisma.classSession.update.mockResolvedValue({ id: 'class-1' });

    await expect(
      service.updateClass('coach-1', 'box-1', 'class-1', {
        description: ' Class focus ',
        workoutId: 'workout-1',
        workoutVariantId: 'variant-1',
      }),
    ).resolves.toEqual({ id: 'class-1' });

    expect(prisma.classSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: 'Class focus',
          workoutId: 'workout-1',
          workoutVariantId: 'variant-1',
        },
      }),
    );
  });

  it('prevents changing class date and time after athletes booked', async () => {
    prisma.boxMembership.findUnique.mockResolvedValue({
      boxId: 'box-1',
      userId: 'coach-1',
      status: 'ACTIVE',
      role: { key: 'COACH' },
    });
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'class-1',
      workoutId: null,
      workoutVariantId: null,
      bookings: [{ id: 'booking-1' }],
    });

    await expect(
      service.updateClass('coach-1', 'box-1', 'class-1', {
        startsAt: '2099-09-15T22:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it('allows an administrator to rotate a Box join code', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.box.findUnique
      .mockResolvedValueOnce({ id: 'box-1' })
      .mockResolvedValueOnce(null);
    prisma.box.update.mockResolvedValue({ id: 'box-1', joinCode: 'NEWCODE1' });

    await expect(
      service.rotateJoinCode('admin-1', 'box-1'),
    ).resolves.toMatchObject({ joinCode: 'NEWCODE1' });
    expect(prisma.box.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'box-1' } }),
    );
  });

  it('protects the Box owner from member removal', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.box.findUnique.mockResolvedValue({ id: 'box-1' });
    prisma.boxMembership.findFirst.mockResolvedValue({
      id: 'member-1',
      userId: 'owner-1',
      roleId: 'box-membership-role-owner',
    });
    prisma.boxMembership.count.mockResolvedValue(0);

    await expect(
      service.removeMember('admin-1', 'box-1', 'member-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows an administrator to assign an existing owner', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.box.findUnique.mockResolvedValue({ id: 'box-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'owner-2' });
    prisma.boxMembership.upsert.mockResolvedValue({
      id: 'member-2',
      userId: 'owner-2',
      status: 'ACTIVE',
      role: { key: 'OWNER' },
      user: {
        email: 'owner@example.com',
        athleteProfile: null,
        coachProfile: null,
      },
    });

    await expect(
      service.assignMember('admin-1', 'box-1', 'owner@example.com', 'OWNER'),
    ).resolves.toMatchObject({ role: 'OWNER', userId: 'owner-2' });
    expect(prisma.boxMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        create: expect.objectContaining({
          boxId: 'box-1',
          userId: 'owner-2',
          roleId: 'box-membership-role-owner',
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('prevents box owners from assigning another owner', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });
    prisma.box.findUnique.mockResolvedValue({ id: 'box-1' });

    await expect(
      service.assignMember('owner-1', 'box-1', 'owner@example.com', 'OWNER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
