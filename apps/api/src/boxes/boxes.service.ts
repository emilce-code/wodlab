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
import { UpdateBoxDto } from './dto/update-box.dto';

const activeBookingStatuses: Array<'BOOKED' | 'ATTENDED'> = [
  'BOOKED',
  'ATTENDED',
];

const classInclude = {
  workout: {
    select: {
      id: true,
      name: true,
      scope: true,
      boxId: true,
    },
  },
  workoutVariant: {
    select: {
      id: true,
      name: true,
      level: {
        select: {
          key: true,
          name: true,
        },
      },
    },
  },
  bookings: {
    where: {
      status: {
        in: activeBookingStatuses,
      },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: {
          email: true,
          athleteProfile: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class BoxesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const [user, memberships] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { activeBoxId: true },
      }),
      this.prisma.boxMembership.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          role: true,
          box: {
            include: {
              _count: {
                select: {
                  memberships: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    return memberships.map(({ box, role }) => ({
      ...box,
      role: box.ownerUserId === userId ? 'OWNER' : role.key,
      isActive: box.id === user?.activeBoxId,
    }));
  }

  async findAllForAdministration() {
    return this.prisma.box.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            classes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(userId: string, dto: CreateBoxDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Administrator access required');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Box name is required');
    }

    const joinCode = await this.createUniqueJoinCode();

    return this.prisma.$transaction(async (transaction) => {
      const box = await transaction.box.create({
        data: {
          name,
          description: dto.description?.trim() || null,
          timezone: dto.timezone?.trim() || 'UTC',
          joinCode,
          ownerUserId: userId,
          memberships: {
            create: {
              userId,
              role: { connect: { key: 'ATHLETE' } },
              status: 'ACTIVE',
              joinedAt: new Date(),
            },
          },
        },
      });

      await transaction.user.update({
        where: { id: userId },
        data: { activeBoxId: box.id },
      });

      return box;
    });
  }

  async update(userId: string, boxId: string, dto: UpdateBoxDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      await this.requireOwner(userId, boxId);
    } else {
      const box = await this.prisma.box.findUnique({
        where: { id: boxId },
        select: { id: true },
      });

      if (!box) {
        throw new NotFoundException('Box not found');
      }
    }

    const name = dto.name?.trim();

    if (dto.name !== undefined && !name) {
      throw new BadRequestException('Box name is required');
    }

    return this.prisma.box.update({
      where: { id: boxId },
      data: {
        ...(dto.name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? {
              description: dto.description.trim() || null,
            }
          : {}),
        ...(dto.timezone !== undefined
          ? {
              timezone: dto.timezone.trim() || 'UTC',
            }
          : {}),
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

    if (existing?.status === 'ACTIVE') {
      throw new ConflictException('You already belong to this box');
    }
    if (existing?.status === 'PENDING') {
      throw new ConflictException('Your request to join this box is pending');
    }

    const membership = existing
      ? await this.prisma.boxMembership.update({
          where: { id: existing.id },
          data: { status: 'PENDING', leftAt: null },
        })
      : await this.prisma.boxMembership.create({
          data: {
            boxId: box.id,
            userId,
            role: { connect: { key: 'ATHLETE' } },
            status: 'PENDING',
          },
        });

    return { box, membershipId: membership.id, status: membership.status };
  }

  async setActiveBox(userId: string, boxId: string) {
    const membership = await this.requireMember(userId, boxId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeBoxId: boxId },
    });

    return {
      boxId,
      role: membership.role,
      active: true,
    };
  }

  async options(userId: string, boxId: string) {
    await this.requireStaff(userId, boxId);

    return this.prisma.workout.findMany({
      where: {
        isActive: true,
        OR: [
          {
            scope: 'GLOBAL',
          },
          {
            scope: 'BOX',
            boxId,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        scope: true,
        boxId: true,
        sourceWorkoutId: true,
        variants: {
          select: {
            id: true,
            name: true,
            level: {
              select: {
                key: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          scope: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findMembers(userId: string, boxId: string) {
    await this.requireOwnerOrAdmin(userId, boxId);
    const box = await this.prisma.box.findUniqueOrThrow({ where: { id: boxId }, select: { ownerUserId: true } });
    const memberships = await this.prisma.boxMembership.findMany({
      where: { boxId },
      select: {
        id: true, userId: true, status: true, joinedAt: true, leftAt: true, createdAt: true,
        role: { select: { key: true } },
        user: {
          select: {
            email: true,
            athleteProfile: { select: { displayName: true } },
            coachProfile: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
    return memberships.map((membership) => ({
      ...membership,
      role: membership.userId === box.ownerUserId ? 'OWNER' : membership.role.key,
    }));
  }

  async updateMember(userId: string, boxId: string, memberId: string, role: 'COACH' | 'ATHLETE') {
    await this.requireOwnerOrAdmin(userId, boxId);
    const box = await this.prisma.box.findUniqueOrThrow({ where: { id: boxId }, select: { ownerUserId: true } });
    const membership = await this.prisma.boxMembership.findFirst({ where: { id: memberId, boxId } });
    if (!membership) throw new NotFoundException('Box member not found');
    if (membership.userId === box.ownerUserId) throw new ConflictException('The Box owner role cannot be changed');
    return this.prisma.boxMembership.update({
      where: { id: memberId },
      data: { role: { connect: { key: role } } },
      include: { role: true },
    });
  }

  async approveMember(userId: string, boxId: string, memberId: string) {
    await this.requireOwnerOrAdmin(userId, boxId);
    const membership = await this.prisma.boxMembership.findFirst({ where: { id: memberId, boxId, status: 'PENDING' } });
    if (!membership) throw new NotFoundException('Pending membership not found');
    return this.prisma.boxMembership.update({
      where: { id: memberId },
      data: { status: 'ACTIVE', joinedAt: new Date(), leftAt: null },
    });
  }

  async deactivateMember(userId: string, boxId: string, memberId: string) {
    await this.requireOwnerOrAdmin(userId, boxId);
    const box = await this.prisma.box.findUniqueOrThrow({ where: { id: boxId }, select: { ownerUserId: true } });
    const membership = await this.prisma.boxMembership.findFirst({ where: { id: memberId, boxId } });
    if (!membership) throw new NotFoundException('Box member not found');
    if (membership.userId === box.ownerUserId) throw new ConflictException('The Box owner cannot be deactivated');
    await this.prisma.$transaction([
      this.prisma.boxMembership.update({ where: { id: memberId }, data: { status: 'INACTIVE', leftAt: new Date() } }),
      this.prisma.user.updateMany({ where: { id: membership.userId, activeBoxId: boxId }, data: { activeBoxId: null } }),
    ]);
    return { id: memberId, status: 'INACTIVE' };
  }

  async reactivateMember(userId: string, boxId: string, memberId: string) {
    await this.requireOwnerOrAdmin(userId, boxId);
    const membership = await this.prisma.boxMembership.findFirst({ where: { id: memberId, boxId, status: 'INACTIVE' } });
    if (!membership) throw new NotFoundException('Inactive membership not found');
    return this.prisma.boxMembership.update({
      where: { id: memberId },
      data: { status: 'ACTIVE', joinedAt: new Date(), leftAt: null },
    });
  }

  async removeMember(userId: string, boxId: string, memberId: string) {
    return this.deactivateMember(userId, boxId, memberId);
  }

  async leave(userId: string, boxId: string) {
    const box = await this.prisma.box.findUnique({ where: { id: boxId }, select: { ownerUserId: true } });
    if (!box) throw new NotFoundException('Box not found');
    if (box.ownerUserId === userId) throw new ConflictException('Transfer Box ownership before leaving');
    const membership = await this.requireMember(userId, boxId);
    await this.prisma.$transaction([
      this.prisma.boxMembership.update({ where: { id: membership.id }, data: { status: 'INACTIVE', leftAt: new Date() } }),
      this.prisma.user.updateMany({ where: { id: userId, activeBoxId: boxId }, data: { activeBoxId: null } }),
    ]);
    return { id: membership.id, status: 'INACTIVE' };
  }

  async rotateJoinCode(userId: string, boxId: string) {
    await this.requireOwnerOrAdmin(userId, boxId);

    const joinCode = await this.createUniqueJoinCode();

    return this.prisma.box.update({
      where: { id: boxId },
      data: { joinCode },
      select: {
        id: true,
        joinCode: true,
      },
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

    if (from > to) {
      throw new BadRequestException('Invalid date range');
    }

    const classes = (await this.prisma.classSession.findMany({
      where: {
        boxId,
        startsAt: {
          gte: from,
          lte: to,
        },
      },
      include: classInclude,
      orderBy: {
        startsAt: 'asc',
      },
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
          OR: [
            {
              scope: 'GLOBAL',
            },
            {
              scope: 'BOX',
              boxId,
            },
          ],
          ...(dto.workoutVariantId
            ? {
                variants: {
                  some: {
                    id: dto.workoutVariantId,
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (!workout) {
        throw new BadRequestException('Invalid workout selection');
      }
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
      where: {
        id: classId,
        boxId,
      },
      include: {
        bookings: {
          where: {
            status: 'ATTENDED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Class not found');
    }

    if (session.bookings.length) {
      throw new ConflictException('Classes with attendance cannot be deleted');
    }

    await this.prisma.classSession.delete({
      where: {
        id: classId,
      },
    });

    return {
      deleted: true,
    };
  }

  async book(userId: string, boxId: string, classId: string) {
    await this.requireMember(userId, boxId);

    return this.prisma.$transaction(
      async (transaction) => {
        const session = await transaction.classSession.findFirst({
          where: {
            id: classId,
            boxId,
          },
        });

        if (!session) {
          throw new NotFoundException('Class not found');
        }

        if (session.startsAt <= new Date()) {
          throw new BadRequestException('This class has already started');
        }

        const count = await transaction.classBooking.count({
          where: {
            classId,
            status: {
              in: ['BOOKED', 'ATTENDED'],
            },
          },
        });

        const existing = await transaction.classBooking.findUnique({
          where: {
            classId_userId: {
              classId,
              userId,
            },
          },
        });

        if (existing?.status === 'BOOKED' || existing?.status === 'ATTENDED') {
          throw new ConflictException('You are already booked');
        }

        if (count >= session.capacity) {
          throw new ConflictException('Class is full');
        }

        return transaction.classBooking.upsert({
          where: {
            classId_userId: {
              classId,
              userId,
            },
          },
          create: {
            classId,
            userId,
          },
          update: {
            status: 'BOOKED',
          },
        });
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  async cancelBooking(userId: string, boxId: string, classId: string) {
    await this.requireMember(userId, boxId);

    const booking = await this.prisma.classBooking.findFirst({
      where: {
        classId,
        userId,
        class: {
          boxId,
        },
        status: 'BOOKED',
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.classBooking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: 'CANCELLED',
      },
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
      where: {
        classId,
        userId: athleteUserId,
        class: {
          boxId,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.classBooking.update({
      where: {
        id: booking.id,
      },
      data: {
        status,
      },
    });
  }

  private async createUniqueJoinCode() {
    let joinCode = randomBytes(4).toString('hex').toUpperCase();

    while (
      await this.prisma.box.findUnique({
        where: {
          joinCode,
        },
      })
    ) {
      joinCode = randomBytes(4).toString('hex').toUpperCase();
    }

    return joinCode;
  }

  private async requireMember(userId: string, boxId: string) {
    const membership = await this.prisma.boxMembership.findUnique({
      where: { boxId_userId: { boxId, userId } },
      include: { role: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('Active Box membership required');
    }
    return membership;
  }

  private async requireStaff(userId: string, boxId: string) {
    const membership = await this.requireMember(userId, boxId);
    const box = await this.prisma.box.findUniqueOrThrow({ where: { id: boxId }, select: { ownerUserId: true } });
    if (box.ownerUserId !== userId && membership.role.key !== 'COACH') {
      throw new ForbiddenException('Box staff access required');
    }
    return membership;
  }

  private async requireOwner(userId: string, boxId: string) {
    const box = await this.prisma.box.findUnique({ where: { id: boxId }, select: { ownerUserId: true } });
    if (!box || box.ownerUserId !== userId) {
      throw new ForbiddenException('Box owner access required');
    }
    return box;
  }

  private async requireOwnerOrAdmin(userId: string, boxId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: { id: true },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    if (user.role === 'ADMIN') {
      return;
    }

    return this.requireOwner(userId, boxId);
  }
}
