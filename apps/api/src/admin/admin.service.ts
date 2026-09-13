import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

type AppRole = 'USER' | 'COACH' | 'ADMIN';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers(query: FindUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const search = query.search?.trim();
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              {
                athleteProfile: {
                  displayName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          athleteProfile: { select: { displayName: true } },
          coachProfile: { select: { displayName: true } },
        },
        orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async updateUserRole(actorUserId: string, userId: string, newRole: AppRole) {
    if (actorUserId === userId) {
      throw new BadRequestException(
        'Administrators cannot change their own role',
      );
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const user = await transaction.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === newRole) return user;

        if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
          const adminCount = await transaction.user.count({
            where: { role: 'ADMIN' },
          });
          if (adminCount <= 1) {
            throw new ConflictException(
              'The last administrator cannot be removed',
            );
          }
        }

        const updated = await transaction.user.update({
          where: { id: userId },
          data: { role: newRole },
          select: {
            id: true,
            email: true,
            role: true,
            athleteProfile: { select: { displayName: true } },
            coachProfile: { select: { displayName: true } },
          },
        });
        await transaction.userRoleChange.create({
          data: {
            userId,
            previousRole: user.role,
            newRole,
            changedById: actorUserId,
          },
        });
        return updated;
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
