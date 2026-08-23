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

  variants: {
    orderBy: {
      level: {
        sortOrder: 'asc' as const,
      },
    },

    include: {
      level: true,

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

              prescriptions: {
                orderBy: {
                  prescriptionCategory: {
                    sortOrder: 'asc' as const,
                  },
                },

                include: {
                  prescriptionCategory: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

const resultInclude = {
  resultType: {
    select: {
      key: true,
      name: true,
    },
  },

  workoutVariant: {
    include: {
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

  findWorkoutLevels() {
    return this.prisma.workoutLevel.findMany({
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

  findPrescriptionCategories() {
    return this.prisma.prescriptionCategory.findMany({
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
          ...resultInclude,

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

  async findResultProgress(
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
          ...resultInclude,

          workout: {
            select: {
              id: true,
              name: true,
              isBenchmark: true,

              type: {
                select: {
                  key: true,
                  name: true,

                  defaultResultType: {
                    select: {
                      key: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    const mappedResults =
      results.map((result) =>
        this.mapWorkoutResult(result),
      );

    const groupedResults =
      new Map<string, any[]>();

    for (const result of mappedResults) {
      const workoutId =
        result.workout.id;

      const levelKey =
        result.workoutVariant
          ?.level.key;

      if (!levelKey) {
        continue;
      }

      const groupKey =
        `${workoutId}:${levelKey}`;

      const current =
        groupedResults.get(groupKey) ??
        [];

      current.push(result);

      groupedResults.set(
        groupKey,
        current,
      );
    }

    const tracks =
      Array.from(
        groupedResults.values(),
      ).map((trackResults) => {
        const latestResult =
          trackResults[0];

        const oldestResult =
          trackResults[
            trackResults.length - 1
          ];

        const level =
          latestResult.workoutVariant
            .level;

        const resultType =
          latestResult.workout.type
            .defaultResultType ??
          latestResult.resultType;

        const personalBest =
          this.getPersonalBest(
            trackResults,
            resultType.key,
          );

        return {
          workout: {
            id:
              latestResult.workout.id,

            name:
              latestResult.workout.name,

            isBenchmark:
              latestResult.workout
                .isBenchmark,

            type: {
              key:
                latestResult.workout.type
                  .key,

              name:
                latestResult.workout.type
                  .name,
            },
          },

          level: {
            key:
              level.key,

            name:
              level.name,
          },

          resultType: {
            key:
              resultType.key,

            name:
              resultType.name,
          },

          attemptCount:
            trackResults.length,

          personalBest,

          latestResult,

          firstResult:
            oldestResult,

          history:
            [...trackResults]
              .sort(
                (a, b) =>
                  new Date(
                    a.performedAt,
                  ).getTime() -
                  new Date(
                    b.performedAt,
                  ).getTime(),
              ),
        };
      });

    tracks.sort(
      (a, b) =>
        new Date(
          b.latestResult.performedAt,
        ).getTime() -
        new Date(
          a.latestResult.performedAt,
        ).getTime(),
    );

    const uniqueWorkoutIds =
      new Set(
        mappedResults.map(
          (result) =>
            result.workout.id,
        ),
      );

    const totalResults =
      mappedResults.length;

    const levelCounts =
      new Map<
        string,
        {
          key: string;
          name: string;
          count: number;
        }
      >();

    mappedResults.forEach(
      (result) => {
        const level =
          result.workoutVariant
            ?.level;

        if (!level) {
          return;
        }

        const existing =
          levelCounts.get(
            level.key,
          );

        if (existing) {
          existing.count += 1;

          return;
        }

        levelCounts.set(
          level.key,
          {
            key: level.key,
            name: level.name,
            count: 1,
          },
        );
      },
    );

    const levelBreakdown =
      Array.from(
        levelCounts.values(),
      ).sort((a, b) => {
        if (a.key === 'RX') {
          return -1;
        }

        if (b.key === 'RX') {
          return 1;
        }

        return (
          b.count - a.count
        );
      });

    const rxResults =
      levelCounts.get('RX')
        ?.count ?? 0;

    const benchmarkWorkoutIds =
      new Set(
        mappedResults
          .filter(
            (result) =>
              result.workout
                .isBenchmark,
          )
          .map(
            (result) =>
              result.workout.id,
          ),
      );

    const benchmarkWorkouts =
      benchmarkWorkoutIds.size;

    return {
      summary: {
        totalResults,

        uniqueWorkouts:
          uniqueWorkoutIds.size,

        rxResults,

        rxRate:
          totalResults > 0
            ? Math.round(
                (rxResults /
                  totalResults) *
                  100,
              )
            : 0,

        levelBreakdown,

        benchmarkWorkouts,
      },

      tracks,
    };
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

        include: resultInclude,
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

        if (dto.variants.length === 0) {
          throw new BadRequestException(
            'At least one workout variant is required',
          );
        }

        for (const variant of dto.variants) {
          const level =
            await tx.workoutLevel.findUnique({
              where: {
                key: variant.levelKey,
              },
            });

          if (!level) {
            throw new NotFoundException(
              `Workout level "${variant.levelKey}" not found`,
            );
          }

          for (const section of variant.sections) {
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

            for (const movement of section.movements) {
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

              for (
                const prescription of
                movement.prescriptions ?? []
              ) {
                const category =
                  await tx.prescriptionCategory.findUnique({
                    where: {
                      key:
                        prescription.categoryKey,
                    },
                  });

                if (!category) {
                  throw new NotFoundException(
                    `Prescription category "${prescription.categoryKey}" not found`,
                  );
                }
              }
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

            variants: {
              create:
                dto.variants.map(
                  (variant) => ({
                    name:
                      variant.name,

                    notes:
                      variant.notes,

                    level: {
                      connect: {
                        key:
                          variant.levelKey,
                      },
                    },

                    sections: {
                      create:
                        variant.sections.map(
                          (section) => ({
                            order:
                              section.order,

                            rounds:
                              section.rounds,

                            durationSeconds:
                              section.durationSeconds,

                            restSeconds:
                              section.restSeconds,

                            repScheme:
                              section.repScheme ??
                              [],

                            notes:
                              section.notes,

                            type: {
                              connect: {
                                key:
                                  section.typeKey,
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
                                        id:
                                          movement.movementId,
                                      },
                                    },

                                    prescriptions: {
                                      create:
                                        (
                                          movement.prescriptions ??
                                          []
                                        ).map(
                                          (
                                            prescription,
                                          ) => ({
                                            reps:
                                              prescription.reps,

                                            weight:
                                              prescription.weight,

                                            weightUnit:
                                              prescription.weightUnit,

                                            distance:
                                              prescription.distance,

                                            calories:
                                              prescription.calories,

                                            durationSeconds:
                                              prescription.durationSeconds,

                                            notes:
                                              prescription.notes,

                                            prescriptionCategory:
                                              {
                                                connect:
                                                  {
                                                    key:
                                                      prescription.categoryKey,
                                                  },
                                              },
                                          }),
                                        ),
                                    },
                                  }),
                                ),
                            },
                          }),
                        ),
                    },
                  }),
                ),
            },
          },

          include: workoutInclude,
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

        include: resultInclude,
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

    const workoutVariant =
      await this.prisma.workoutVariant.findFirst({
        where: {
          id: dto.workoutVariantId,
          workoutId,
        },

        include: {
          level: true,
        },
      });

    if (!workoutVariant) {
      throw new NotFoundException(
        'Workout variant not found for this workout',
      );
    }

    const prescriptionCategory =
      dto.prescriptionCategoryKey
        ? await this.prisma.prescriptionCategory.findUnique({
            where: {
              key:
                dto.prescriptionCategoryKey,
            },
          })
        : null;

    if (
      dto.prescriptionCategoryKey &&
      !prescriptionCategory
    ) {
      throw new NotFoundException(
        `Prescription category "${dto.prescriptionCategoryKey}" not found`,
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

          workoutVariant: {
            connect: {
              id: workoutVariant.id,
            },
          },

          ...(prescriptionCategory
            ? {
                prescriptionCategory: {
                  connect: {
                    id:
                      prescriptionCategory.id,
                  },
                },
              }
            : {}),

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
              ? new Date(
                  dto.performedAt,
                )
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

          notes:
            dto.notes,
        },

        include: resultInclude,
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
          workout.type
            .defaultResultType
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
          workout.createdByUser
            .email,
      },

      variants:
        workout.variants.map(
          (variant: any) => ({
            id:
              variant.id,

            name:
              variant.name,

            notes:
              variant.notes,

            level: {
              key:
                variant.level.key,

              name:
                variant.level.name,
            },

            sections:
              variant.sections.map(
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
                      section.type
                        .defaultResultType
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
                          item.weight !==
                          null
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

                        prescriptions:
                          item.prescriptions.map(
                            (
                              prescription: any,
                            ) => ({
                              id:
                                prescription.id,

                              category: {
                                key:
                                  prescription
                                    .prescriptionCategory
                                    .key,

                                name:
                                  prescription
                                    .prescriptionCategory
                                    .name,
                              },

                              reps:
                                prescription.reps,

                              weight:
                                prescription.weight !==
                                null
                                  ? Number(
                                      prescription.weight,
                                    )
                                  : null,

                              weightUnit:
                                prescription.weightUnit,

                              distance:
                                prescription.distance,

                              calories:
                                prescription.calories,

                              durationSeconds:
                                prescription.durationSeconds,

                              notes:
                                prescription.notes,
                            }),
                          ),
                      }),
                    ),
                }),
              ),
          }),
        ),
    } as WorkoutResponseDto;
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
          dto.rounds ===
            undefined &&
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
    const workoutVariant =
      result.workoutVariant
        ? {
            id:
              result.workoutVariant.id,

            name:
              result.workoutVariant.name,

            level: {
              key:
                result.workoutVariant.level
                  .key,

              name:
                result.workoutVariant.level
                  .name,
            },
          }
        : null;

    const prescriptionCategory =
      result.prescriptionCategory
        ? {
            key:
              result.prescriptionCategory
                .key,

            name:
              result.prescriptionCategory
                .name,
          }
        : null;

    return {
      ...result,

      load:
        result.load !== null
          ? Number(result.load)
          : null,

      workoutVariant,

      prescriptionCategory,
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
                result.reps !==
                null,
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
                result.load !==
                null,
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