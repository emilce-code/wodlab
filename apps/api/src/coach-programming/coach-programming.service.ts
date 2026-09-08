import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ApplyProgramTemplateDto } from './dto/apply-program-template.dto';
import { CreateCoachGroupDto } from './dto/create-coach-group.dto';
import { CreateProgramTemplateDto } from './dto/create-program-template.dto';
import { FindCoachAnalyticsQueryDto } from './dto/find-coach-analytics-query.dto';
import { FindCoachMonitoringQueryDto } from './dto/find-coach-monitoring-query.dto';

const groupInclude = {
  members: {
    orderBy: { createdAt: 'asc' },
    include: {
      athleteProfile: {
        select: {
          id: true,
          displayName: true,
          user: { select: { email: true } },
        },
      },
    },
  },
} satisfies Prisma.CoachGroupInclude;

const templateInclude = {
  items: {
    orderBy: [{ dayOffset: 'asc' }, { sortOrder: 'asc' }],
    include: {
      workout: { select: { id: true, name: true, isActive: true } },
      workoutVariant: {
        select: {
          id: true,
          name: true,
          level: { select: { key: true, name: true } },
        },
      },
      prescriptionCategory: { select: { key: true, name: true } },
    },
  },
} satisfies Prisma.ProgramTemplateInclude;

@Injectable()
export class CoachProgrammingService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(userId: string) {
    const coach = await this.getCoach(userId);
    const [groups, templates, relationships, workouts, categories] =
      await Promise.all([
        this.prisma.coachGroup.findMany({
          where: { coachProfileId: coach.id },
          orderBy: { name: 'asc' },
          include: groupInclude,
        }),
        this.prisma.programTemplate.findMany({
          where: { coachProfileId: coach.id },
          orderBy: { name: 'asc' },
          include: templateInclude,
        }),
        this.prisma.coachAthleteRelationship.findMany({
          where: { coachProfileId: coach.id, status: 'ACTIVE' },
          orderBy: { athleteProfile: { displayName: 'asc' } },
          select: {
            athleteProfile: {
              select: {
                id: true,
                displayName: true,
                user: { select: { email: true } },
              },
            },
          },
        }),
        this.prisma.workout.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            variants: {
              orderBy: { level: { sortOrder: 'asc' } },
              select: {
                id: true,
                name: true,
                level: { select: { key: true, name: true } },
              },
            },
          },
        }),
        this.prisma.prescriptionCategory.findMany({
          orderBy: { sortOrder: 'asc' },
          select: { key: true, name: true },
        }),
      ]);

    return {
      groups,
      templates,
      athletes: relationships.map((item) => item.athleteProfile),
      workouts,
      prescriptionCategories: categories,
    };
  }

  async getMonitoring(userId: string, query: FindCoachMonitoringQueryDto) {
    const coach = await this.getCoach(userId);
    const from = query.from ? this.parseDate(query.from) : undefined;
    const to = query.to ? this.parseDate(query.to) : undefined;
    if (from && to && from > to) {
      throw new BadRequestException(
        'The start date must be before the end date',
      );
    }

    let athleteIds: string[] | undefined;
    if (query.groupId) {
      const group = await this.prisma.coachGroup.findFirst({
        where: { id: query.groupId, coachProfileId: coach.id },
        select: { members: { select: { athleteProfileId: true } } },
      });
      if (!group) throw new NotFoundException('Coach group not found');
      athleteIds = group.members.map((member) => member.athleteProfileId);
    }
    if (query.athleteProfileId) {
      const relationship = await this.prisma.coachAthleteRelationship.findFirst(
        {
          where: {
            coachProfileId: coach.id,
            athleteProfileId: query.athleteProfileId,
            status: 'ACTIVE',
          },
        },
      );
      if (!relationship)
        throw new ForbiddenException('Active coach relationship required');
      athleteIds = [query.athleteProfileId];
    }

    const today = this.parseDate(new Date().toISOString().slice(0, 10));
    const status = query.status ?? 'ALL';
    const items = await this.prisma.scheduledWorkout.findMany({
      where: {
        assignedByCoachProfileId: coach.id,
        athleteProfileId: athleteIds ? { in: athleteIds } : undefined,
        scheduledDate: from || to ? { gte: from, lte: to } : undefined,
        status:
          status === 'PLANNED' || status === 'OVERDUE'
            ? 'PLANNED'
            : status === 'COMPLETED' || status === 'NEEDS_REVIEW'
              ? 'COMPLETED'
              : undefined,
        ...(status === 'OVERDUE'
          ? { scheduledDate: { lt: today, gte: from, lte: to } }
          : {}),
        ...(status === 'NEEDS_REVIEW' ? { reviewedAt: null } : {}),
      },
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        athleteProfile: { select: { id: true, displayName: true } },
        workout: { select: { id: true, name: true } },
        workoutVariant: {
          select: {
            id: true,
            name: true,
            level: { select: { key: true, name: true } },
          },
        },
        prescriptionCategory: { select: { key: true, name: true } },
        workoutResult: { select: { id: true, performedAt: true } },
      },
    });

    const summary = items.reduce(
      (result, item) => {
        result.total += 1;
        if (item.status === 'COMPLETED') {
          result.completed += 1;
          if (!item.reviewedAt) result.needsReview += 1;
        } else if (item.scheduledDate < today) {
          result.overdue += 1;
        } else {
          result.planned += 1;
        }
        return result;
      },
      { total: 0, planned: 0, completed: 0, overdue: 0, needsReview: 0 },
    );

    return { summary, items };
  }

  async getAnalytics(userId: string, query: FindCoachAnalyticsQueryDto) {
    const coach = await this.getCoach(userId);
    const from = this.parseDate(query.from);
    const to = this.parseDate(query.to);
    if (from > to) {
      throw new BadRequestException(
        'The start date must be before the end date',
      );
    }

    const athleteIds = await this.resolveAnalyticsAthleteIds(
      coach.id,
      query.groupId,
      query.athleteProfileId,
    );
    const assignments = await this.prisma.scheduledWorkout.findMany({
      where: {
        assignedByCoachProfileId: coach.id,
        athleteProfileId: athleteIds ? { in: athleteIds } : undefined,
        scheduledDate: { gte: from, lte: to },
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        athleteProfile: { select: { id: true, displayName: true } },
        workout: {
          select: {
            id: true,
            name: true,
            type: { select: { key: true, name: true } },
          },
        },
        workoutResult: {
          select: {
            reps: true,
            load: true,
            weightUnit: true,
            performedMovements: {
              select: {
                reps: true,
                load: true,
                weightUnit: true,
                workoutMovement: {
                  select: {
                    movement: {
                      select: {
                        category: { select: { key: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const today = this.parseDate(new Date().toISOString().slice(0, 10));
    const athletes = new Map<
      string,
      {
        id: string;
        name: string;
        assigned: number;
        completed: number;
        overdue: number;
        totalReps: number;
        totalLoadKg: number;
      }
    >();
    const weeks = new Map<string, { assigned: number; completed: number }>();
    const workoutTypes = new Map<
      string,
      { key: string; name: string; count: number }
    >();
    const movementCategories = new Map<
      string,
      { key: string; name: string; count: number }
    >();
    const workouts = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    let completed = 0;
    let overdue = 0;
    let totalReps = 0;
    let totalLoadKg = 0;

    for (const assignment of assignments) {
      const done = assignment.status === 'COMPLETED';
      const late = !done && assignment.scheduledDate < today;
      if (done) completed += 1;
      if (late) overdue += 1;

      const athlete = athletes.get(assignment.athleteProfile.id) ?? {
        id: assignment.athleteProfile.id,
        name: assignment.athleteProfile.displayName,
        assigned: 0,
        completed: 0,
        overdue: 0,
        totalReps: 0,
        totalLoadKg: 0,
      };
      athlete.assigned += 1;
      if (done) athlete.completed += 1;
      if (late) athlete.overdue += 1;

      const weekStart = this.weekStart(assignment.scheduledDate);
      const week = weeks.get(weekStart) ?? { assigned: 0, completed: 0 };
      week.assigned += 1;
      if (done) week.completed += 1;
      weeks.set(weekStart, week);

      const type = workoutTypes.get(assignment.workout.type.key) ?? {
        ...assignment.workout.type,
        count: 0,
      };
      type.count += 1;
      workoutTypes.set(type.key, type);

      const workout = workouts.get(assignment.workout.id) ?? {
        id: assignment.workout.id,
        name: assignment.workout.name,
        count: 0,
      };
      workout.count += 1;
      workouts.set(workout.id, workout);

      const result = assignment.workoutResult;
      if (result) {
        const performedMovements = result.performedMovements;
        if (performedMovements.length === 0) {
          const resultReps = result.reps ?? 0;
          const resultLoad = this.toKilograms(result.load, result.weightUnit);
          athlete.totalReps += resultReps;
          athlete.totalLoadKg += resultLoad;
          totalReps += resultReps;
          totalLoadKg += resultLoad;
        }

        for (const movement of performedMovements) {
          const reps = movement.reps ?? 0;
          const load = this.toKilograms(movement.load, movement.weightUnit);
          athlete.totalReps += reps;
          athlete.totalLoadKg += load;
          totalReps += reps;
          totalLoadKg += load;
          const category = movement.workoutMovement.movement.category;
          const distribution = movementCategories.get(category.key) ?? {
            ...category,
            count: 0,
          };
          distribution.count += 1;
          movementCategories.set(category.key, distribution);
        }
      }
      athletes.set(athlete.id, athlete);
    }

    const addRate = <T extends { assigned: number; completed: number }>(
      value: T,
    ) => ({
      ...value,
      completionRate:
        value.assigned === 0
          ? 0
          : Math.round((value.completed / value.assigned) * 100),
    });

    return {
      range: { from: query.from, to: query.to },
      summary: {
        assigned: assignments.length,
        completed,
        overdue,
        completionRate:
          assignments.length === 0
            ? 0
            : Math.round((completed / assignments.length) * 100),
        totalReps,
        totalLoadKg: Math.round(totalLoadKg * 10) / 10,
      },
      athletes: [...athletes.values()]
        .map(addRate)
        .sort(
          (left, right) =>
            right.completionRate - left.completionRate ||
            left.name.localeCompare(right.name),
        ),
      weekly: [...weeks.entries()].map(([weekStart, value]) => ({
        weekStart,
        ...addRate(value),
      })),
      workoutTypes: [...workoutTypes.values()].sort(
        (left, right) => right.count - left.count,
      ),
      movementCategories: [...movementCategories.values()].sort(
        (left, right) => right.count - left.count,
      ),
      workouts: [...workouts.values()]
        .sort((left, right) => right.count - left.count)
        .slice(0, 10),
    };
  }

  async createGroup(userId: string, dto: CreateCoachGroupDto) {
    const coach = await this.getCoach(userId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Group name is required');

    try {
      return await this.prisma.coachGroup.create({
        data: {
          coachProfileId: coach.id,
          name,
          description: dto.description?.trim() || null,
        },
        include: groupInclude,
      });
    } catch (error) {
      this.rethrowNameConflict(error, 'A group with this name already exists');
    }
  }

  async deleteGroup(userId: string, groupId: string) {
    const coach = await this.getCoach(userId);
    const group = await this.requireGroup(coach.id, groupId);
    return this.prisma.coachGroup.delete({ where: { id: group.id } });
  }

  async addGroupMember(
    userId: string,
    groupId: string,
    athleteProfileId: string,
  ) {
    const coach = await this.getCoach(userId);
    await this.requireGroup(coach.id, groupId);
    const relationship = await this.prisma.coachAthleteRelationship.findFirst({
      where: {
        coachProfileId: coach.id,
        athleteProfileId,
        status: 'ACTIVE',
      },
    });
    if (!relationship) {
      throw new ForbiddenException('Active coach relationship required');
    }

    return this.prisma.coachGroupMember.upsert({
      where: { groupId_athleteProfileId: { groupId, athleteProfileId } },
      create: { groupId, athleteProfileId },
      update: {},
    });
  }

  async removeGroupMember(
    userId: string,
    groupId: string,
    athleteProfileId: string,
  ) {
    const coach = await this.getCoach(userId);
    await this.requireGroup(coach.id, groupId);
    const member = await this.prisma.coachGroupMember.findUnique({
      where: { groupId_athleteProfileId: { groupId, athleteProfileId } },
    });
    if (!member) throw new NotFoundException('Group member not found');
    return this.prisma.coachGroupMember.delete({ where: { id: member.id } });
  }

  async createTemplate(userId: string, dto: CreateProgramTemplateDto) {
    const coach = await this.getCoach(userId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Template name is required');
    if (dto.items.length === 0) {
      throw new BadRequestException('At least one template item is required');
    }

    const items = await Promise.all(
      dto.items.map(async (item, sortOrder) => {
        const variant = await this.prisma.workoutVariant.findFirst({
          where: {
            id: item.workoutVariantId,
            workoutId: item.workoutId,
            workout: { isActive: true },
          },
        });
        if (!variant) {
          throw new NotFoundException('Active workout variation not found');
        }
        const category = item.prescriptionCategoryKey
          ? await this.prisma.prescriptionCategory.findUnique({
              where: { key: item.prescriptionCategoryKey },
            })
          : null;
        if (item.prescriptionCategoryKey && !category) {
          throw new NotFoundException('Prescription category not found');
        }
        return {
          dayOffset: item.dayOffset,
          workoutId: item.workoutId,
          workoutVariantId: item.workoutVariantId,
          prescriptionCategoryId: category?.id,
          coachNotes: item.coachNotes?.trim() || null,
          sortOrder,
        };
      }),
    );

    try {
      return await this.prisma.programTemplate.create({
        data: {
          coachProfileId: coach.id,
          name,
          description: dto.description?.trim() || null,
          items: { create: items },
        },
        include: templateInclude,
      });
    } catch (error) {
      this.rethrowNameConflict(
        error,
        'A program template with this name already exists',
      );
    }
  }

  async deleteTemplate(userId: string, templateId: string) {
    const coach = await this.getCoach(userId);
    const template = await this.requireTemplate(coach.id, templateId);
    return this.prisma.programTemplate.delete({ where: { id: template.id } });
  }

  async applyTemplate(
    userId: string,
    templateId: string,
    dto: ApplyProgramTemplateDto,
  ) {
    const coach = await this.getCoach(userId);
    const weekStart = this.parseDate(dto.weekStart);
    const [group, template] = await Promise.all([
      this.prisma.coachGroup.findFirst({
        where: { id: dto.groupId, coachProfileId: coach.id },
        include: {
          members: {
            where: {
              athleteProfile: {
                coachRelationships: {
                  some: { coachProfileId: coach.id, status: 'ACTIVE' },
                },
              },
            },
          },
        },
      }),
      this.prisma.programTemplate.findFirst({
        where: { id: templateId, coachProfileId: coach.id },
        include: { items: { include: { workout: true } } },
      }),
    ]);
    if (!group) throw new NotFoundException('Coach group not found');
    if (!template) throw new NotFoundException('Program template not found');
    if (group.members.length === 0) {
      throw new BadRequestException('The coach group has no active athletes');
    }
    if (template.items.some((item) => !item.workout.isActive)) {
      throw new BadRequestException(
        'The template contains an inactive workout',
      );
    }

    const data = group.members.flatMap((member) =>
      template.items.map((item) => ({
        athleteProfileId: member.athleteProfileId,
        workoutId: item.workoutId,
        workoutVariantId: item.workoutVariantId,
        prescriptionCategoryId: item.prescriptionCategoryId,
        scheduledDate: this.addDays(weekStart, item.dayOffset),
        assignedByCoachProfileId: coach.id,
        coachNotes: item.coachNotes,
      })),
    );
    const result = await this.prisma.scheduledWorkout.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      requested: data.length,
      created: result.count,
      skipped: data.length - result.count,
    };
  }

  private async getCoach(userId: string) {
    const coach = await this.prisma.coachProfile.findUnique({
      where: { userId },
    });
    if (!coach) throw new ForbiddenException('Coach profile required');
    return coach;
  }

  private async resolveAnalyticsAthleteIds(
    coachProfileId: string,
    groupId?: string,
    athleteProfileId?: string,
  ) {
    if (athleteProfileId) {
      const relationship = await this.prisma.coachAthleteRelationship.findFirst(
        {
          where: { coachProfileId, athleteProfileId, status: 'ACTIVE' },
        },
      );
      if (!relationship) {
        throw new ForbiddenException('Active coach relationship required');
      }
      return [athleteProfileId];
    }
    if (!groupId) return undefined;
    const group = await this.prisma.coachGroup.findFirst({
      where: { id: groupId, coachProfileId },
      select: { members: { select: { athleteProfileId: true } } },
    });
    if (!group) throw new NotFoundException('Coach group not found');
    return group.members.map((member) => member.athleteProfileId);
  }

  private weekStart(value: Date) {
    const date = new Date(value);
    const day = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
    return date.toISOString().slice(0, 10);
  }

  private toKilograms(
    value: Prisma.Decimal | number | null,
    unit: 'KG' | 'LB' | null,
  ) {
    if (value === null) return 0;
    const amount = Number(value);
    return unit === 'LB' ? amount * 0.45359237 : amount;
  }

  private async requireGroup(coachProfileId: string, groupId: string) {
    const group = await this.prisma.coachGroup.findFirst({
      where: { id: groupId, coachProfileId },
    });
    if (!group) throw new NotFoundException('Coach group not found');
    return group;
  }

  private async requireTemplate(coachProfileId: string, templateId: string) {
    const template = await this.prisma.programTemplate.findFirst({
      where: { id: templateId, coachProfileId },
    });
    if (!template) throw new NotFoundException('Program template not found');
    return template;
  }

  private parseDate(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('Invalid week start date');
    }
    return date;
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private rethrowNameConflict(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
    throw error;
  }
}
