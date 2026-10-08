Warning: truncated output (original token count: 8048)
Total output lines: 1278

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBoxOrganizationDto } from './dto/create-box-organization.dto';
import { CreateBoxDto } from './dto/create-box.dto';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { FindClassSessionsQueryDto } from './dto/find-class-sessions-query.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { UpdateBoxOrganizationDto } from './dto/update-box-organization.dto';
import { UpdateBoxDto } from './dto/update-box.dto';

type BoxMembershipRoleKey = 'OWNER' | 'COACH' | 'ATHLETE';

const activeBookingStatuses: Array<'BOOKED' | 'ATTENDED'> = [
  'BOOKED',
  'ATTENDED',
];

function boxMembershipRoleId(role: BoxMembershipRoleKey) {
  return `box-membership-role-${role.toLowerCase()}`;
}

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
                  memberships: { where: { status: 'ACTIVE' } },
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
      role: role.key,
      isActive: box.id === user?.activeBoxId,
    }));
  }

  async findAllForAdministration() {
    return this.prisma.box.findMany({
      include: {
        organization: true,
        _count: {
          select: {
            memberships: { where: { status: 'ACTIVE' } },
            classes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOrganizationsForAdministration() {
    return this.prisma.boxOrganization.findMany({
      include: {
        owners: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                athleteProfile: {
                  select: { displayName: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { boxes: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createOrganization(userId: string, dto: CreateBoxOrganizationDto) {
    await this.requireAdmin(userId);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Organization name is required');
    }

    return this.prisma.boxOrganization.create({
      data: {
        name,
        description: dto.description?.trim() || null,
        logoPath: dto.logoPath?.trim() || null,
        owners: {
          create: { userId },
        },
      },
      include: { owners: true },
    });
  }

  async updateOrganization(
    userId: string,
    organizationId: string,
    dto: UpdateBoxOrganizationDto,
  ) {
    await this.requireOrganizationOwnerOrAdmin(userId, organizationId);

    const name = dto.name?.trim();
    if (dto.name !== undefined && !name) {
      throw new BadRequestException('Organization name is required');
    }

    return this.prisma.boxOrganization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.logoPath !== undefined
          ? { logoPath: dto.logoPath?.trim() || null }
          : {}),
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
    const organizationId = dto.organizationId?.trim() || null;

    if (organizationId) {
      await this.ensureOrganizationExists(organizationId);
    }

    return this.prisma.$transaction(async (transaction) => {
      const box = await transaction.box.create({
        data: {
          name,
          description: dto.description?.trim() || null,
          timezone: dto.timezone?.trim() || 'UTC',
          location: dto.location?.trim() || null,
          address: dto.address?.trim() || dto.location?.trim() || null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          logoPath: dto.logoPath?.trim() || null,
          coverImagePath: dto.coverImagePath?.trim() || null,
          supportContact: dto.supportContact?.trim() || null,
          organizationId,
          joinCode,
          ownerUserId: userId,
          memberships: {
            create: {
              userId,
              roleId: 'box-membership-role-owner',
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

    await this.requireBoxManagementAccess(userId, boxId, user.role);

    const name = dto.name?.trim();
    const organizationId = dto.organizationId?.trim() || null;

    if (dto.name !== undefined && !name) {
      throw new BadRequestException('Box name is required');
    }

    if (organizationId) {
      await this.ensureOrganizationExists(organizationId);
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
        ...(dto.location !== undefined
          ? { location: dto.location.trim() || null }
          : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() || null }
          : dto.location !== undefined
            ? { address: dto.location.trim() || null }
            : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude:…4048 tokens truncated…wait this.requireMember(userId, boxId);

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

  private async getMemberOrAdmin(userId: string, boxId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      const box = await this.prisma.box.findUnique({
        where: { id: boxId },
        select: { id: true },
      });

      if (!box) {
        throw new NotFoundException('Box not found');
      }

      return null;
    }

    return this.requireMember(userId, boxId);
  }

  private async requireStaff(userId: string, boxId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      const box = await this.prisma.box.findUnique({
        where: { id: boxId },
        select: { id: true },
      });

      if (!box) {
        throw new NotFoundException('Box not found');
      }

      return null;
    }

    const organizationOwner = await this.getOrganizationOwnerForBox(
      userId,
      boxId,
    );
    if (organizationOwner) {
      return null;
    }

    const membership = await this.requireMember(userId, boxId);
    if (membership.role.key !== 'OWNER' && membership.role.key !== 'COACH') {
      throw new ForbiddenException('Box staff access required');
    }
    return membership;
  }

  private async requireOwner(userId: string, boxId: string) {
    const membership = await this.prisma.boxMembership.findUnique({
      where: { boxId_userId: { boxId, userId } },
      include: { role: true },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.role.key !== 'OWNER'
    ) {
      const organizationOwner = await this.getOrganizationOwnerForBox(
        userId,
        boxId,
      );
      if (organizationOwner) {
        return null;
      }
      throw new ForbiddenException('Box owner access required');
    }
    return membership;
  }

  private async requireOwnerOrAdmin(userId: string, boxId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.requireBoxManagementAccess(userId, boxId, user.role);
  }

  private async requireAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Administrator access required');
    }
  }

  private async ensureOrganizationExists(organizationId: string) {
    const organization = await this.prisma.boxOrganization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async requireOrganizationOwnerOrAdmin(
    userId: string,
    organizationId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      await this.ensureOrganizationExists(organizationId);
      return;
    }

    const owner = await this.prisma.boxOrganizationOwner.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true },
    });

    if (!owner) {
      throw new ForbiddenException('Organization owner access required');
    }
  }

  private async requireBoxManagementAccess(
    userId: string,
    boxId: string,
    userRole?: 'USER' | 'COACH' | 'ADMIN',
  ) {
    if (userRole === 'ADMIN') {
      const box = await this.prisma.box.findUnique({
        where: { id: boxId },
        select: { id: true },
      });

      if (!box) {
        throw new NotFoundException('Box not found');
      }

      return;
    }

    await this.requireOwner(userId, boxId);
  }

  private async getOrganizationOwnerForBox(userId: string, boxId: string) {
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    if (!box.organizationId) {
      return null;
    }

    return this.prisma.boxOrganizationOwner.findUnique({
      where: {
        organizationId_userId: {
          organizationId: box.organizationId,
          userId,
        },
      },
      select: { id: true },
    });
  }

  private async requireRoleAssignmentAccess(
    userId: string,
    boxId: string,
    role: BoxMembershipRoleKey,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: { id: true, organizationId: true },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    if (role === 'OWNER') {
      if (user.role !== 'ADMIN') {
        throw new ForbiddenException('Administrator access required');
      }
      return;
    }

    if (user.role === 'ADMIN') {
      return;
    }

    if (box.organizationId) {
      const organizationOwner =
        await this.prisma.boxOrganizationOwner.findUnique({
          where: {
            organizationId_userId: {
              organizationId: box.organizationId,
              userId,
            },
          },
          select: { id: true },
        });
      if (organizationOwner) {
        return;
      }
    }

    await this.requireOwner(userId, boxId);
  }

  private async ensureAnotherActiveOwner(boxId: string, membershipId: string) {
    const owners = await this.prisma.boxMembership.count({
      where: {
        boxId,
        status: 'ACTIVE',
        role: { key: 'OWNER' },
        id: { not: membershipId },
      },
    });

    if (owners === 0) {
      throw new ConflictException('A Box must have at least one owner');
    }
  }
}