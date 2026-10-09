import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
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
      findMany: jest.fn(),
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
    boxOrganizationOwner: {
      findUnique: jest.fn(),
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
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue(null);
  });

  afterEach(() => jest.clearAllMocks());

  describe('class details', () => {
    const bookings = [
      { id: 'mine', userId: 'user-1', status: 'BOOKED' },
      { id: 'other', userId: 'user-2', status: 'ATTENDED' },
    ];
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.classSession.findFirst.mockResolvedValue({
        id: 'class-1',
        boxId: 'box-1',
        capacity: 10,
        bookings,
      });
    });
    it('returns athlete availability and own booking without exposing the roster', async () => {
      await expect(
        service.findClass('user-1', 'box-1', 'class-1'),
      ).resolves.toMatchObject({
        role: 'ATHLETE',
        bookedCount: 2,
        currentUserBooking: { id: 'mine', status: 'BOOKED' },
        bookings: [],
      });
      expect(prisma.classSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'class-1', boxId: 'box-1' } }),
      );
    });
    it('preserves staff roster access', async () => {
      prisma.boxMembership.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        role: { key: 'COACH' },
      });
      await expect(
        service.findClass('user-1', 'box-1', 'class-1'),
      ).resolves.toMatchObject({ role: 'COACH', bookings });
    });
    it('rejects inactive members before reading the class', async () => {
      prisma.boxMembership.findUnique.mockResolvedValue({
        status: 'PENDING',
        role: { key: 'ATHLETE' },
      });
      await expect(
        service.findClass('user-1', 'box-1', 'class-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.classSession.findFirst).not.toHaveBeenCalled();
    });
    it('rejects missing membership', async () => {
      prisma.boxMembership.findUnique.mockResolvedValue(null);
      await expect(
        service.findClass('user-1', 'box-1', 'class-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('cannot read a class from another box through an authorized box', async () => {
      prisma.classSession.findFirst.mockResolvedValue(null);
      await expect(
        service.findClass('user-1', 'box-1', 'foreign-class'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.classSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'foreign-class', boxId: 'box-1' },
        }),
      );
    });
  });

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

  it.each(['COACH', 'ATHLETE'])(
    'rejects profile mutations from a %s member',
    async (role) => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.boxMembership.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        role: { key: role },
      });
      prisma.box.findUnique.mockResolvedValue({
        id: 'box-1',
        organizationId: null,
      });
      await expect(
        service.update('user-1', 'box-1', {
          logoPath: 'logo.webp',
          whatsapp: '+595981123456',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.box.update).not.toHaveBeenCalled();
    },
  );

  it('rejects access to another organization and box', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    prisma.boxMembership.findUnique.mockResolvedValue(null);
    prisma.box.findUnique.mockResolvedValue({
      id: 'other-box',
      organizationId: 'other-org',
    });
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue(null);
    await expect(
      service.update('owner-1', 'other-box', { name: 'Changed' }),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.details('owner-1', 'other-box')).rejects.toThrow(
      ForbiddenException,
      NotFoundException,
    );
    expect(prisma.box.update).not.toHaveBeenCalled();
  });

  it('prevents an ordinary owner from reassigning its organization', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    prisma.boxMembership.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      role: { key: 'OWNER' },
    });
    await expect(
      service.update('owner-1', 'box-1', { organizationId: 'other-org' }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.box.update).not.toHaveBeenCalled();
  });

  it('persists structured contacts without erasing legacy data or other optional fields', async () => {
    prisma.box.findUnique.mockResolvedValue({ id: 'box-1' });
    await service.update('admin-1', 'box-1', {
      whatsapp: '+595981123456',
      phone: null,
      email: 'hello@example.com',
      instagram: '@box',
      website: 'https://example.com',
    });
    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-1' },
      data: {
        whatsapp: '+595981123456',
        phone: null,
        email: 'hello@example.com',
        instagram: '@box',
        website: 'https://example.com',
      },
    });
  });

  it.each(['OWNER', 'COACH', 'ATHLETE'])(
    'returns scoped edit capability for %s',
    async (role) => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.box.findUnique.mockResolvedValue({
        id: 'box-1',
        organizationId: null,
        supportContact: 'Legacy',
        whatsapp: '+595981123456',
      });
      prisma.boxMembership.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        role: { key: role },
      });
      await expect(service.details('user-1', 'box-1')).resolves.toMatchObject({
        canEditDetails: role === 'OWNER',
        supportContact: 'Legacy',
        whatsapp: '+595981123456',
      });
    },
  );

  it('allows an organization owner to read and edit without a box membership', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    prisma.box.findUnique.mockResolvedValue({
      id: 'box-1',
      organizationId: 'org-1',
    });
    prisma.boxMembership.findUnique.mockResolvedValue(null);
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue({
      id: 'ownership-1',
    });
    await expect(service.details('owner-1', 'box-1')).resolves.toMatchObject({
      canEditDetails: true,
    });
  });

  it('rejects an incomplete coordinate pair but permits clearing both', async () => {
    prisma.box.findUnique.mockResolvedValue({ id: 'box-1' });
    prisma.box.findUniqueOrThrow.mockResolvedValue({
      latitude: null,
      longitude: null,
    });
    await expect(
      service.update('admin-1', 'box-1', { latitude: 0 }),
    ).rejects.toThrow(BadRequestException);
    await service.update('admin-1', 'box-1', {
      latitude: null,
      longitude: null,
    });
    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-1' },
      data: { latitude: null, longitude: null },
    });
  });

  it('limits managed box discovery to active box owners and organization owners', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    prisma.box.findMany.mockResolvedValue([]);
    await service.managed('owner-1');
    expect(prisma.box.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              memberships: {
                some: {
                  userId: 'owner-1',
                  status: 'ACTIVE',
                  role: { key: 'OWNER' },
                },
              },
            },
            { organization: { owners: { some: { userId: 'owner-1' } } } },
          ],
        },
      }),
    );
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

  it('allows an organization owner to update a box in the organization', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });
    prisma.boxMembership.findUnique.mockResolvedValue(null);
    prisma.box.findUnique.mockResolvedValue({
      id: 'box-1',
      organizationId: 'org-1',
    });
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue({
      id: 'org-owner-1',
    });
    prisma.box.update.mockResolvedValue({ id: 'box-1', name: 'North Box' });

    await service.update('user-1', 'box-1', {
      name: ' North Box ',
    });

    expect(prisma.box.update).toHaveBeenCalledWith({
      where: { id: 'box-1' },
      data: { name: 'North Box' },
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

  it('allows an organization owner to assign coaches to boxes in the organization', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });
    prisma.box.findUnique.mockResolvedValue({
      id: 'box-1',
      organizationId: 'org-1',
    });
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue({
      id: 'org-owner-1',
    });
    prisma.user.findFirst.mockResolvedValue({ id: 'coach-1' });
    prisma.boxMembership.upsert.mockResolvedValue({
      id: 'membership-1',
      role: { key: 'COACH' },
      user: { email: 'coach@example.com' },
    });

    await service.assignMember(
      'org-owner-user',
      'box-1',
      'coach@example.com',
      'COACH',
    );

    expect(prisma.boxMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        create: expect.objectContaining({
          roleId: 'box-membership-role-coach',
        }),
      }),
    );
  });

  it('prevents organization owners from assigning box owners', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'COACH' });
    prisma.box.findUnique.mockResolvedValue({
      id: 'box-1',
      organizationId: 'org-1',
    });
    prisma.boxOrganizationOwner.findUnique.mockResolvedValue({
      id: 'org-owner-1',
    });

    await expect(
      service.assignMember(
        'org-owner-user',
        'box-1',
        'owner@example.com',
        'OWNER',
      ),
    ).rejects.toThrow('Administrator access required');
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
