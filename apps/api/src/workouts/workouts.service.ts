import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { WorkoutResponseDto } from './dto/workout-response.dto';

const workoutInclude = {
  type: true,

  createdByUser: {
    select: {
      id: true,
      email: true,
    },
  },

  sections: {
    orderBy: {
      order: 'asc' as const,
    },

    include: {
      type: true,

      movements: {
        orderBy: {
          order: 'asc' as const,
        },

        include: {
          movement: true,
        },
      },
    },
  },
};

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  findWorkoutTypes() {
    return this.prisma.workoutType.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        key: true,
        name: true,
        description: true,

        defaultResultType: {
          select: {
            key: true,
            name: true,
          },
        },
      },
    });
  }

  findResultTypes() {
    return this.prisma.resultType.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        key: true,
        name: true,
        description: true,
      },
    });
  }

  async findAll(): Promise<WorkoutResponseDto[]> {
    const workouts = await this.prisma.workout.findMany({
      include: workoutInclude,

      orderBy: {
        createdAt: 'desc',
      },
    });

    return workouts.map((workout) => this.mapWorkout(workout));
  }

  async findOne(id: string): Promise<WorkoutResponseDto> {
    const workout = await this.prisma.workout.findUnique({
      where: {
        id,
      },

      include: workoutInclude,
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return this.mapWorkout(workout);
  }

  async create(userId: string, dto: CreateWorkoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const workoutType = await tx.workoutType.findUnique({
        where: {
          key: dto.typeKey,
        },
      });

      if (!workoutType) {
        throw new NotFoundException(
          `Workout type "${dto.typeKey}" not found`,
        );
      }

      for (const section of dto.sections) {
        const sectionType = await tx.workoutType.findUnique({
          where: {
            key: section.typeKey,
          },
        });

        if (!sectionType) {
          throw new NotFoundException(
            `Workout section type "${section.typeKey}" not found`,
          );
        }

        for (const movement of section.movements) {
          const existingMovement = await tx.movement.findUnique({
            where: {
              id: movement.movementId,
            },
          });

          if (!existingMovement) {
            throw new NotFoundException(
              `Movement "${movement.movementId}" not found`,
            );
          }
        }
      }

      return tx.workout.create({
        data: {
          name: dto.name,
          description: dto.description,
          isBenchmark: dto.isBenchmark ?? false,

          createdByUser: {
            connect: {
              id: userId,
            },
          },

          type: {
            connect: {
              key: dto.typeKey,
            },
          },

          sections: {
            create: dto.sections.map((section) => ({
              order: section.order,
              rounds: section.rounds,
              durationSeconds: section.durationSeconds,
              restSeconds: section.restSeconds,
              repScheme: section.repScheme ?? [],
              notes: section.notes,

              type: {
                connect: {
                  key: section.typeKey,
                },
              },

              movements: {
                create: section.movements.map((movement) => ({
                  order: movement.order,
                  reps: movement.reps,
                  weight: movement.weight,
                  weightUnit: movement.weightUnit,
                  distance: movement.distance,
                  calories: movement.calories,
                  durationSeconds: movement.durationSeconds,
                  notes: movement.notes,

                  movement: {
                    connect: {
                      id: movement.movementId,
                    },
                  },
                })),
              },
            })),
          },
        },

        include: {
          type: true,
          sections: {
            orderBy: {
              order: 'asc',
            },
            include: {
              type: true,
              movements: {
                orderBy: {
                  order: 'asc',
                },
                include: {
                  movement: true,
                },
              },
            },
          },
        },
      });
    });
  }

  private mapWorkout(workout: any): WorkoutResponseDto {
    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      isBenchmark: workout.isBenchmark,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,

      type: {
        key: workout.type.key,
        name: workout.type.name,
      },

      createdByUser: {
        id: workout.createdByUser.id,
        email: workout.createdByUser.email,
      },

      sections: workout.sections.map((section: any) => ({
        id: section.id,
        order: section.order,
        rounds: section.rounds,
        durationSeconds: section.durationSeconds,
        restSeconds: section.restSeconds,
        repScheme: section.repScheme,
        notes: section.notes,

        type: {
          key: section.type.key,
          name: section.type.name,
        },

        movements: section.movements.map((item: any) => ({
          id: item.id,
          order: item.order,
          reps: item.reps,
          weight:
            item.weight !== null
              ? Number(item.weight)
              : null,
          weightUnit: item.weightUnit,
          distance: item.distance,
          calories: item.calories,
          durationSeconds: item.durationSeconds,
          notes: item.notes,

          movement: {
            id: item.movement.id,
            name: item.movement.name,
          },
        })),
      })),
    };
  }
}