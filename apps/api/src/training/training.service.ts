import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async findHistory(userId: string) {
    const athleteProfile = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!athleteProfile) {
      throw new NotFoundException('Athlete profile not found');
    }

    const [workoutResults, movementResults] = await Promise.all([
      this.prisma.workoutResult.findMany({
        where: { athleteProfileId: athleteProfile.id },
        orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          resultType: {
            select: {
              key: true,
              name: true,
            },
          },

          workout: {
            select: {
              id: true,
              name: true,
              isBenchmark: true,
              type: {
                select: {
                  key: true,
                  name: true,
                },
              },
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

          prescriptionCategory: {
            select: {
              key: true,
              name: true,
            },
          },

          generatedMovementResults: {
            orderBy: [{ performedAt: 'asc' }, { createdAt: 'asc' }],
            include: {
              movement: {
                select: {
                  id: true,
                  name: true,
                },
              },

              measurementType: {
                select: {
                  key: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.movementResult.findMany({
        where: {
          athleteProfileId: athleteProfile.id,
          sourceWorkoutResultId: null,
        },
        orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          movement: {
            select: {
              id: true,
              name: true,
            },
          },

          measurementType: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const workoutItems = workoutResults.map((result) => ({
      id: result.id,
      type: 'WORKOUT' as const,
      performedAt: result.performedAt,

      workout: {
        id: result.workout.id,
        name: result.workout.name,
        isBenchmark: result.workout.isBenchmark,
        type: {
          key: result.workout.type.key,
          name: result.workout.type.name,
        },
      },

      variant: {
        id: result.workoutVariant.id,
        name: result.workoutVariant.name,
      },

      level: {
        key: result.workoutVariant.level.key,
        name: result.workoutVariant.level.name,
      },

      prescriptionCategory: result.prescriptionCategory
        ? {
            key: result.prescriptionCategory.key,
            name: result.prescriptionCategory.name,
          }
        : null,

      result: {
        type: {
          key: result.resultType.key,
          name: result.resultType.name,
        },
        timeSeconds: result.timeSeconds,
        rounds: result.rounds,
        reps: result.reps,
        load: result.load !== null ? Number(result.load) : null,
        weightUnit: result.weightUnit,
      },

      movements: result.generatedMovementResults.map((movementResult) => ({
        id: movementResult.id,

        movement: {
          id: movementResult.movement.id,
          name: movementResult.movement.name,
        },

        measurementType: {
          key: movementResult.measurementType.key,
          name: movementResult.measurementType.name,
        },

        reps: movementResult.reps,
        load:
          movementResult.load !== null
            ? Number(movementResult.load)
            : null,
        weightUnit: movementResult.weightUnit,
        distance: movementResult.distance,
        durationSeconds: movementResult.durationSeconds,
        calories: movementResult.calories,
        notes: movementResult.notes,
      })),

      notes: result.notes,
    }));

    const movementItems = movementResults.map((result) => ({
      id: result.id,
      type: 'MOVEMENT' as const,
      performedAt: result.performedAt,

      movement: {
        id: result.movement.id,
        name: result.movement.name,
      },

      measurementType: {
        key: result.measurementType.key,
        name: result.measurementType.name,
      },

      result: {
        reps: result.reps,
        load: result.load !== null ? Number(result.load) : null,
        weightUnit: result.weightUnit,
        distance: result.distance,
        durationSeconds: result.durationSeconds,
        calories: result.calories,
      },

      notes: result.notes,
    }));

    const items = [...workoutItems, ...movementItems].sort((a, b) => {
      return b.performedAt.getTime() - a.performedAt.getTime();
    });

    return {
      items,
    };
  }
}