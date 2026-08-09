import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResultDto } from './dto/create-workout-result.dto';
import { WorkoutResponseDto } from './dto/workout-response.dto';

const workoutInclude = {
  type: {
    include: {
      defaultResultType: {
        select: {
          key: true,
          name: true,
        },
      },
    },
  },

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
      type: {
        include: {
          defaultResultType: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      },

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
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

  async findAll(): Promise<
    WorkoutResponseDto[]
  > {
    const workouts =
      await this.prisma.workout.findMany({
        include: workoutInclude,

        orderBy: {
          createdAt: 'desc',
        },
      });

    return workouts.map((workout) =>
      this.mapWorkout(workout),
    );
  }

  async findOne(
    id: string,
  ): Promise<WorkoutResponseDto> {
    const workout =
      await this.prisma.workout.findUnique({
        where: {
          id,
        },

        include: workoutInclude,
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found',
      );
    }

    return this.mapWorkout(workout);
  }

  async findResultHistory(
    userId: string,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    const results =
      await this.prisma.workoutResult.findMany({
        where: {
          athleteProfileId:
            athleteProfile.id,
        },

        orderBy: {
          performedAt: 'desc',
        },

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
        },
      });

    return results.map((result) =>
      this.mapWorkoutResult(result),
    );
  }

  async findResults(
    userId: string,
    workoutId: string,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    const workout =
      await this.prisma.workout.findUnique({
        where: {
          id: workoutId,
        },

        select: {
          id: true,
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found',
      );
    }

    const results =
      await this.prisma.workoutResult.findMany({
        where: {
          workoutId,
          athleteProfileId:
            athleteProfile.id,
        },

        orderBy: {
          performedAt: 'desc',
        },

        include: {
          resultType: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      });

    return results.map((result) =>
      this.mapWorkoutResult(result),
    );
  }

  async create(
    userId: string,
    dto: CreateWorkoutDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const workoutType =
          await tx.workoutType.findUnique({
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
          const sectionType =
            await tx.workoutType.findUnique({
              where: {
                key: section.typeKey,
              },
            });

          if (!sectionType) {
            throw new NotFoundException(
              `Workout section type "${section.typeKey}" not found`,
            );
          }

          for (
            const movement of section.movements
          ) {
            const existingMovement =
              await tx.movement.findUnique({
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
            isBenchmark:
              dto.isBenchmark ?? false,

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
              create: dto.sections.map(
                (section) => ({
                  order: section.order,
                  rounds: section.rounds,

                  durationSeconds:
                    section.durationSeconds,

                  restSeconds:
                    section.restSeconds,

                  repScheme:
                    section.repScheme ?? [],

                  notes:
                    section.notes,

                  type: {
                    connect: {
                      key: section.typeKey,
                    },
                  },

                  movements: {
                    create:
                      section.movements.map(
                        (movement) => ({
                          order:
                            movement.order,

                          reps:
                            movement.reps,

                          weight:
                            movement.weight,

                          weightUnit:
                            movement.weightUnit,

                          distance:
                            movement.distance,

                          calories:
                            movement.calories,

                          durationSeconds:
                            movement.durationSeconds,

                          notes:
                            movement.notes,

                          movement: {
                            connect: {
                              id: movement.movementId,
                            },
                          },
                        }),
                      ),
                  },
                }),
              ),
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
      },
    );
  }

  async findResultSummary(
    userId: string,
    workoutId: string,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    const workout =
      await this.prisma.workout.findUnique({
        where: {
          id: workoutId,
        },

        include: {
          type: {
            include: {
              defaultResultType: true,
            },
          },
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found',
      );
    }

    const results =
      await this.prisma.workoutResult.findMany({
        where: {
          workoutId,
          athleteProfileId:
            athleteProfile.id,
        },

        orderBy: {
          performedAt: 'desc',
        },

        include: {
          resultType: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      });

    const mappedResults =
      results.map((result) =>
        this.mapWorkoutResult(result),
      );

    const resultType =
      workout.type.defaultResultType;

    const personalBest =
      resultType
        ? this.getPersonalBest(
            mappedResults,
            resultType.key,
          )
        : null;

    return {
      personalBest,

      lastResult:
        mappedResults[0] ?? null,

      totalResults:
        mappedResults.length,
    };
  }

  async createResult(
    userId: string,
    workoutId: string,
    dto: CreateWorkoutResultDto,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    const workout =
      await this.prisma.workout.findUnique({
        where: {
          id: workoutId,
        },

        include: {
          type: {
            include: {
              defaultResultType: true,
            },
          },
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found',
      );
    }

    const resultType =
      workout.type.defaultResultType;

    if (!resultType) {
      throw new BadRequestException(
        `Workout type "${workout.type.name}" does not have a default result type`,
      );
    }

    this.validateResultForType(
      resultType.key,
      dto,
    );

    const result =
      await this.prisma.workoutResult.create({
        data: {
          workout: {
            connect: {
              id: workout.id,
            },
          },

          athleteProfile: {
            connect: {
              id: athleteProfile.id,
            },
          },

          resultType: {
            connect: {
              id: resultType.id,
            },
          },

          performedAt:
            dto.performedAt
              ? new Date(dto.performedAt)
              : new Date(),

          timeSeconds:
            dto.timeSeconds,

          rounds:
            dto.rounds,

          reps:
            dto.reps,

          load:
            dto.load,

          weightUnit:
            dto.weightUnit,

          isRx:
            dto.isRx ?? false,

          notes:
            dto.notes,
        },

        include: {
          resultType: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      });

    return this.mapWorkoutResult(
      result,
    );
  }

  private mapWorkout(
    workout: any,
  ): WorkoutResponseDto {
    return {
      id:
        workout.id,

      name:
        workout.name,

      description:
        workout.description,

      isBenchmark:
        workout.isBenchmark,

      createdAt:
        workout.createdAt,

      updatedAt:
        workout.updatedAt,

      type: {
        key:
          workout.type.key,

        name:
          workout.type.name,

        defaultResultType:
          workout.type.defaultResultType
            ? {
                key:
                  workout.type
                    .defaultResultType
                    .key,

                name:
                  workout.type
                    .defaultResultType
                    .name,
              }
            : null,
      },

      createdByUser: {
        id:
          workout.createdByUser.id,

        email:
          workout.createdByUser.email,
      },

      sections:
        workout.sections.map(
          (section: any) => ({
            id:
              section.id,

            order:
              section.order,

            rounds:
              section.rounds,

            durationSeconds:
              section.durationSeconds,

            restSeconds:
              section.restSeconds,

            repScheme:
              section.repScheme,

            notes:
              section.notes,

            type: {
              key:
                section.type.key,

              name:
                section.type.name,

              defaultResultType:
                section.type.defaultResultType
                  ? {
                      key:
                        section.type
                          .defaultResultType
                          .key,

                      name:
                        section.type
                          .defaultResultType
                          .name,
                    }
                  : null,
            },

            movements:
              section.movements.map(
                (item: any) => ({
                  id:
                    item.id,

                  order:
                    item.order,

                  reps:
                    item.reps,

                  weight:
                    item.weight !== null
                      ? Number(
                          item.weight,
                        )
                      : null,

                  weightUnit:
                    item.weightUnit,

                  distance:
                    item.distance,

                  calories:
                    item.calories,

                  durationSeconds:
                    item.durationSeconds,

                  notes:
                    item.notes,

                  movement: {
                    id:
                      item.movement.id,

                    name:
                      item.movement.name,
                  },
                }),
              ),
          }),
        ),
    };
  }

  private validateResultForType(
    resultTypeKey: string,
    dto: CreateWorkoutResultDto,
  ) {
    switch (resultTypeKey) {
      case 'TIME': {
        if (
          dto.timeSeconds ===
          undefined
        ) {
          throw new BadRequestException(
            'timeSeconds is required for time-based workouts',
          );
        }

        break;
      }

      case 'ROUNDS_REPS': {
        if (
          dto.rounds === undefined &&
          dto.reps === undefined
        ) {
          throw new BadRequestException(
            'rounds or reps is required for rounds + reps workouts',
          );
        }

        break;
      }

      case 'REPS': {
        if (
          dto.reps === undefined
        ) {
          throw new BadRequestException(
            'reps is required for repetition-based workouts',
          );
        }

        break;
      }

      case 'LOAD': {
        if (
          dto.load === undefined
        ) {
          throw new BadRequestException(
            'load is required for load-based workouts',
          );
        }

        if (!dto.weightUnit) {
          throw new BadRequestException(
            'weightUnit is required for load-based workouts',
          );
        }

        break;
      }

      default: {
        throw new BadRequestException(
          `Unsupported result type "${resultTypeKey}"`,
        );
      }
    }
  }

  private mapWorkoutResult(
    result: any,
  ) {
    return {
      ...result,

      load:
        result.load !== null
          ? Number(result.load)
          : null,
    };
  }

  private getPersonalBest(
    results: any[],
    resultTypeKey: string,
  ) {
    const validResults =
      results.filter(
        (result) =>
          result.resultType.key ===
          resultTypeKey,
      );

    if (
      validResults.length === 0
    ) {
      return null;
    }

    switch (resultTypeKey) {
      case 'TIME': {
        return (
          [...validResults]
            .filter(
              (result) =>
                result.timeSeconds !==
                null,
            )
            .sort(
              (a, b) =>
                a.timeSeconds -
                b.timeSeconds,
            )[0] ?? null
        );
      }

      case 'ROUNDS_REPS': {
        return (
          [...validResults].sort(
            (a, b) => {
              const roundDifference =
                (b.rounds ?? 0) -
                (a.rounds ?? 0);

              if (
                roundDifference !== 0
              ) {
                return roundDifference;
              }

              return (
                (b.reps ?? 0) -
                (a.reps ?? 0)
              );
            },
          )[0] ?? null
        );
      }

      case 'REPS': {
        return (
          [...validResults]
            .filter(
              (result) =>
                result.reps !== null,
            )
            .sort(
              (a, b) =>
                b.reps -
                a.reps,
            )[0] ?? null
        );
      }

      case 'LOAD': {
        return (
          [...validResults]
            .filter(
              (result) =>
                result.load !== null,
            )
            .sort(
              (a, b) =>
                this.normalizeLoadToKg(
                  b,
                ) -
                this.normalizeLoadToKg(
                  a,
                ),
            )[0] ?? null
        );
      }

      default:
        return null;
    }
  }

  private normalizeLoadToKg(
    result: {
      load: number | null;
      weightUnit:
        | 'KG'
        | 'LB'
        | null;
    },
  ) {
    if (
      result.load === null
    ) {
      return 0;
    }

    if (
      result.weightUnit === 'LB'
    ) {
      return (
        result.load *
        0.45359237
      );
    }

    return result.load;
  }
}