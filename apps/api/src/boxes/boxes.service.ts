import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { FindClassSessionsQueryDto } from './dto/find-class-sessions-query.dto';

const activeBookingStatuses: Array<'BOOKED' | 'ATTENDED'> = [
  'BOOKED',
  'ATTENDED',
];

const classInclude = {
  workout: { select: { id: true, name: true } },
  workoutVariant: {
    select: {
      id: true,
      name: true,
      level: { select: { key: true, name: true } },
    },
  },
  bookings: {
    where: { status: { in: activeBookingStatuses } },
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: {
          email: true,
          athleteProfile: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class BoxesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.boxMembership.findMany({
      where: { userId },
      include: {
        box: {
          include: {
            _count: { select: { memberships: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ box, role }) => ({ ...box, role }));
  }

  async create(userId: string, dto: CreateBoxDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coachProfile: { select: { id: true } } },
    });
    if (!user?.coachProfile) {
      throw new ForbiddenException('Coach profile required to create a box');
    }
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Box name is required');
    let joinCode = randomBytes(4).toString('hex').toUpperCase();
    while (await this.prisma.box.findUnique({ where: { joinCode } })) {
      joinCode = randomBytes(4).toString('hex').toUpperCase();
    }
    return this.prisma.box.create({
      data: {
        name,
        description: dto.description?.trim() || null,
        timezone: dto.timezone?.trim() || 'UTC',
        joinCode,
        ownerUserId: userId,
        memberships: { create: { userId, role: 'OWNER' } },
      },
    });
  }

  async join(userId: string, joinCode: string) {
    const box = await this.prisma.box.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
    });
    if (!box) throw new NotFoundException('Box not found');
    const existing = await this.prisma.boxMembership.findUnique({
      where: { boxId_userId: { boxId: box.id, userId } },
    });
    if (existing) throw new ConflictException('You already belong to this box');
    await this.prisma.boxMembership.create({
      data: { boxId: box.id, userId, role: 'ATHLETE' },
    });
    return box;
  }

  async options(userId: string, boxId: string) {
    await this.requireStaff(userId, boxId);
    return this.prisma.workout.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        variants: {
          select: {
            id: true,
            name: true,
            level: { select: { key: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMembers(userId: string, boxId: string) {
    await this.requireStaff(userId, boxId);
    return this.prisma.boxMembership.findMany({
      where: { boxId },
      select: {
        id: true,
        userId: true,
        role: true,
        user: {
          select: {
            email: true,
            athleteProfile: { select: { displayName: true } },
            coachProfile: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async updateMember(
    userId: string,
    boxId: string,
    memberId: string,
    role: 'COACH' | 'ATHLETE',
  ) {
    await this.requireOwner(userId, boxId);
    const membership = await this.prisma.boxMembership.findFirst({
      where: { id: memberId, boxId, role: { not: 'OWNER' } },
    });
    if (!membership) throw new NotFoundException('Box member not found');
    return this.prisma.boxMembership.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async findClasses(
    userId: string,
    boxId: string,
    query: FindClassSessionsQueryDto,
  ) {
    const membership = await this.requireMember(userId, boxId);
    const from = query.from ? new Date(query.from) : new Date();
    const to = query.to
      ? new Date(query.to)
      : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (from > to) throw new BadRequestException('Invalid date range');
    const classes = (await this.prisma.classSession.findMany({
      where: { boxId, startsAt: { gte: from, lte: to } },
      include: classInclude,
      orderBy: { startsAt: 'asc' },
    })) as unknown as Array<{
      bookings: Array<{ userId: string }>;
      [key: string]: unknown;
    }>;
    return {
      role: membership.role,
      classes: classes.map((session) => ({
        ...session,
        bookedCount: session.bookings.length,
        currentUserBooking:
          session.bookings.find((booking) => booking.userId === userId) ?? null,
      })),
    };
  }

  async createClass(userId: string, boxId: string, dto: CreateClassSessionDto) {
    await this.requireStaff(userId, boxId);
    const startsAt = new Date(dto.startsAt);
    if (startsAt <= new Date()) {
      throw new BadRequestException('Class must start in the future');
    }
    if (dto.workoutVariantId && !dto.workoutId) {
      throw new BadRequestException('Workout is required for a variation');
    }
    if (dto.workoutId) {
      const workout = await this.prisma.workout.findFirst({
        where: {
          id: dto.workoutId,
          isActive: true,
          ...(dto.workoutVariantId
            ? { variants: { some: { id: dto.workoutVariantId } } }
            : {}),
        },
        select: { id: true },
      });
      if (!workout) throw new BadRequestException('Invalid workout selection');
    }
    return this.prisma.classSession.create({
      data: {
        boxId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        startsAt,
        durationMinutes: dto.durationMinutes,
        capacity: dto.capacity,
        workoutId: dto.workoutId || null,
        workoutVariantId: dto.workoutVariantId || null,
        createdByUserId: userId,
      },
      include: classInclude,
    });
  }

  async deleteClass(userId: string, boxId: string, classId: string) {
    await this.requireStaff(userId, boxId);
    const session = await this.prisma.classSession.findFirst({
      where: { id: classId, boxId },
      include: {
        bookings: { where: { status: 'ATTENDED' }, select: { id: true } },
      },
    });
    if (!session) throw new NotFoundException('Class not found');
    if (session.bookings.length) {
      throw new ConflictException('Classes with attendance cannot be deleted');
    }
    await this.prisma.classSession.delete({ where: { id: classId } });
    return { deleted: true };
  }

  async book(userId: string, boxId: string, classId: string) {
    await this.requireMember(userId, boxId);
    return this.prisma.$transaction(
      async (transaction) => {
        const session = await transaction.classSession.findFirst({
          where: { id: classId, boxId },
        });
        if (!session) throw new NotFoundException('Class not found');
        if (session.startsAt <= new Date()) {
          throw new BadRequestException('This class has already started');
        }
        const count = await transaction.classBooking.count({
          where: { classId, status: { in: ['BOOKED', 'ATTENDED'] } },
        });
        const existing = await transaction.classBooking.findUnique({
          where: { classId_userId: { classId, userId } },
        });
        if (existing?.status === 'BOOKED' || existing?.status === 'ATTENDED') {
          throw new ConflictException('You are already booked');
        }
        if (count >= session.capacity)
          throw new ConflictException('Class is full');
        return transaction.classBooking.upsert({
          where: { classId_userId: { classId, userId } },
          create: { classId, userId },
          update: { status: 'BOOKED' },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async cancelBooking(userId: string, boxId: string, classId: string) {
    await this.requireMember(userId, boxId);
    const booking = await this.prisma.classBooking.findFirst({
      where: { classId, userId, class: { boxId }, status: 'BOOKED' },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.classBooking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });
  }

  async attendance(
    userId: string,
    boxId: string,
    classId: string,
    athleteUserId: string,
    status: 'BOOKED' | 'ATTENDED' | 'CANCELLED',
  ) {
    await this.requireStaff(userId, boxId);
    const booking = await this.prisma.classBooking.findFirst({
      where: { classId, userId: athleteUserId, class: { boxId } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.classBooking.update({
      where: { id: booking.id },
      data: { status },
    });
  }

  private async requireMember(userId: string, boxId: string) {
    const membership = await this.prisma.boxMembership.findUnique({
      where: { boxId_userId: { boxId, userId } },
    });
    if (!membership) throw new ForbiddenException('Box membership required');
    return membership;
  }

  private async requireStaff(userId: string, boxId: string) {
    const membership = await this.requireMember(userId, boxId);
    if (membership.role === 'ATHLETE') {
      throw new ForbiddenException('Box staff access required');
    }
    return membership;
  }

  private async requireOwner(userId: string, boxId: string) {
    const membership = await this.requireMember(userId, boxId);
    if (membership.role !== 'OWNER') {
      throw new ForbiddenException('Box owner access required');
    }
    return membership;
  }
}
