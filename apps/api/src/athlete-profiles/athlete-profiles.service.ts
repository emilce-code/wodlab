import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UpdateAthleteProfileDto } from './dto/update-athlete-profile.dto';

@Injectable()
export class AthleteProfilesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findByUserId(userId: string) {
    return this.prisma.athleteProfile.findUnique({
      where: {
        userId,
      },

      include: {
        preferredWorkoutLevel: true,
        preferredPrescriptionCategory: true,
      },
    });
  }

  async updateByUserId(
    userId: string,
    dto: UpdateAthleteProfileDto,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    let preferredWorkoutLevelId:
      | string
      | null
      | undefined;

    if (
      dto.preferredWorkoutLevelKey !==
      undefined
    ) {
      if (
        dto.preferredWorkoutLevelKey ===
        null
      ) {
        preferredWorkoutLevelId = null;
      } else {
        const workoutLevel =
          await this.prisma.workoutLevel.findUnique({
            where: {
              key:
                dto.preferredWorkoutLevelKey,
            },

            select: {
              id: true,
            },
          });

        if (!workoutLevel) {
          throw new BadRequestException(
            `Workout level "${dto.preferredWorkoutLevelKey}" does not exist`,
          );
        }

        preferredWorkoutLevelId =
          workoutLevel.id;
      }
    }

    let preferredPrescriptionCategoryId:
      | string
      | null
      | undefined;

    if (
      dto.preferredPrescriptionCategoryKey !==
      undefined
    ) {
      if (
        dto.preferredPrescriptionCategoryKey ===
        null
      ) {
        preferredPrescriptionCategoryId =
          null;
      } else {
        const prescriptionCategory =
          await this.prisma.prescriptionCategory.findUnique({
            where: {
              key:
                dto.preferredPrescriptionCategoryKey,
            },

            select: {
              id: true,
            },
          });

        if (!prescriptionCategory) {
          throw new BadRequestException(
            `Prescription category "${dto.preferredPrescriptionCategoryKey}" does not exist`,
          );
        }

        preferredPrescriptionCategoryId =
          prescriptionCategory.id;
      }
    }

    return this.prisma.athleteProfile.update({
      where: {
        id: athleteProfile.id,
      },

      data: {
        ...(dto.displayName !== undefined
          ? {
              displayName:
                dto.displayName.trim(),
            }
          : {}),

        ...(dto.preferredWeightUnit !==
        undefined
          ? {
              preferredWeightUnit:
                dto.preferredWeightUnit,
            }
          : {}),

        ...(preferredWorkoutLevelId !==
        undefined
          ? {
              preferredWorkoutLevelId,
            }
          : {}),

        ...(preferredPrescriptionCategoryId !==
        undefined
          ? {
              preferredPrescriptionCategoryId,
            }
          : {}),
      },

      include: {
        preferredWorkoutLevel: true,
        preferredPrescriptionCategory: true,
      },
    });
  }
}