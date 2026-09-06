import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ScheduledWorkoutStatus } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduledWorkoutDto } from './dto/create-scheduled-workout.dto';
import { FindScheduledWorkoutsQueryDto } from './dto/find-scheduled-workouts-query.dto';
import { UpdateScheduledWorkoutDto } from './dto/update-scheduled-workout.dto';

const scheduledWorkoutInclude = {
  workout: {
    select: {
      id: true,
      name: true,
      description: true,
      isBenchmark: true,
      isActive: true,
      type: { select: { key: true, name: true } },
    },
  },
  workoutVariant: {
    select: {
      id: true,
      name: true,
      level: { select: { key: true, name: true } },
    },
  },
  prescriptionCategory: {
    select: { key: true, name: true },
  },
  workoutResult: {
    select: { id: true, performedAt: true },
  },
} satisfies Prisma.ScheduledWorkoutInclude;

@Injectable()
export class ScheduledWorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateScheduledWorkoutDto) {
    const athleteProfileId = await this.getAthleteProfileId(userId);
    await this.validateWorkoutSelection(dto.workoutId, dto.workoutVariantId);
    const prescriptionCategoryId = await this.resolvePrescriptionCategoryId(
      dto.prescriptionCategoryKey,
    );
    const scheduledDate = this.parseDate(dto.scheduledDate);
    const duplicateCount = await this.prisma.scheduledWorkout.count({
      where: {
        athleteProfileId,
        workoutVariantId: dto.workoutVariantId,
        scheduledDate,
      },
    });

    if (duplicateCount > 0) {
      throw new ConflictException(
        'This workout variation is already scheduled for that date',
      );
    }

    try {
      return await this.prisma.scheduledWorkout.create({
        data: {
          athleteProfileId,
          workoutId: dto.workoutId,
          workoutVariantId: dto.workoutVariantId,
          prescriptionCategoryId,
          scheduledDate,
          notes: this.normalizeNotes(dto.notes),
        },
        include: scheduledWorkoutInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This workout variation is already scheduled for that date',
        );
      }

      throw error;
    }
  }

  async findAll(userId: string, query: FindScheduledWorkoutsQueryDto) {
    const athleteProfileId = await this.getAthleteProfileId(userId);
    const from = query.from ? this.parseDate(query.from) : undefined;
    const to = query.to ? this.parseDate(query.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException(
        'The start date must be before the end date',
      );
    }

    const items = await this.prisma.scheduledWorkout.findMany({
      where: {
        athleteProfileId,
        status: query.status,
        scheduledDate:
          from || to
            ? {
                gte: from,
                lte: to,
              }
            : undefined,
      },
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
      include: scheduledWorkoutInclude,
    });

    return { items };
  }

  async update(
    userId: string,
    scheduledWorkoutId: string,
    dto: UpdateScheduledWorkoutDto,
  ) {
    const athleteProfileId = await this.getAthleteProfileId(userId);
    const scheduledWorkout = await this.findOwnedScheduledWorkout(
      athleteProfileId,
      scheduledWorkoutId,
    );

    this.ensurePlanned(scheduledWorkout.status);

    const workoutVariantId =
      dto.workoutVariantId ?? scheduledWorkout.workoutVariantId;

    await this.validateWorkoutSelection(
      scheduledWorkout.workoutId,
      workoutVariantId,
    );

    const prescriptionCategoryId =
      dto.prescriptionCategoryKey === undefined
        ? undefined
        : await this.resolvePrescriptionCategoryId(
            dto.prescriptionCategoryKey ?? undefined,
          );
    const scheduledDate = dto.scheduledDate
      ? this.parseDate(dto.scheduledDate)
      : scheduledWorkout.scheduledDate;
    const duplicateCount = await this.prisma.scheduledWorkout.count({
      where: {
        id: { not: scheduledWorkout.id },
        athleteProfileId,
        workoutVariantId,
        scheduledDate,
      },
    });

    if (duplicateCount > 0) {
      throw new ConflictException(
        'This workout variation is already scheduled for that date',
      );
    }

    try {
      return await this.prisma.scheduledWorkout.update({
        where: { id: scheduledWorkout.id },
        data: {
          workoutVariantId: dto.workoutVariantId,
          prescriptionCategoryId,
          scheduledDate: dto.scheduledDate ? scheduledDate : undefined,
          notes:
            dto.notes === undefined
              ? undefined
              : this.normalizeNotes(dto.notes),
        },
        include: scheduledWorkoutInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This workout variation is already scheduled for that date',
        );
      }

      throw error;
    }
  }

  async remove(userId: string, scheduledWorkoutId: string) {
    const athleteProfileId = await this.getAthleteProfileId(userId);
    const scheduledWorkout = await this.findOwnedScheduledWorkout(
      athleteProfileId,
      scheduledWorkoutId,
    );

    this.ensurePlanned(scheduledWorkout.status);

    await this.prisma.scheduledWorkout.delete({
      where: { id: scheduledWorkout.id },
    });

    return { id: scheduledWorkout.id, deleted: true };
  }

  private async getAthleteProfileId(userId: string) {
    const athleteProfile = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!athleteProfile) {
      throw new NotFoundException('Athlete profile not found');
    }

    return athleteProfile.id;
  }

  private async validateWorkoutSelection(
    workoutId: string,
    workoutVariantId: string,
  ) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, isActive: true },
      select: { id: true },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const variant = await this.prisma.workoutVariant.findFirst({
      where: { id: workoutVariantId, workoutId },
      select: { id: true },
    });

    if (!variant) {
      throw new BadRequestException(
        'Workout variation does not belong to the selected workout',
      );
    }
  }

  private async resolvePrescriptionCategoryId(key?: string) {
    if (!key) {
      return null;
    }

    const category = await this.prisma.prescriptionCategory.findUnique({
      where: { key },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Prescription category not found');
    }

    return category.id;
  }

  private async findOwnedScheduledWorkout(
    athleteProfileId: string,
    scheduledWorkoutId: string,
  ) {
    const scheduledWorkout = await this.prisma.scheduledWorkout.findFirst({
      where: { id: scheduledWorkoutId, athleteProfileId },
      select: {
        id: true,
        workoutId: true,
        workoutVariantId: true,
        scheduledDate: true,
        status: true,
      },
    });

    if (!scheduledWorkout) {
      throw new NotFoundException('Scheduled workout not found');
    }

    return scheduledWorkout;
  }

  private ensurePlanned(status: ScheduledWorkoutStatus) {
    if (status !== ScheduledWorkoutStatus.PLANNED) {
      throw new ConflictException(
        'Completed scheduled workouts cannot be changed or removed',
      );
    }
  }

  private parseDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private normalizeNotes(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
