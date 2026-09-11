import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import {
  createPaginatedResponse,
  type PaginatedResponse,
} from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { FindWorkoutsQueryDto } from './dto/find-workouts-query.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
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
              movement: {
                include: {
                  measurementTypes: {
                    orderBy: {
                      measurementType: {
                        sortOrder: 'asc' as const,
                      },
                    },

                    include: {
                      measurementType: {
                        select: {
                          key: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },

              prescriptions: {
                orderBy: {
                  prescriptionCategory: {
                    sortOrder: 'asc' as const,
                  },
                },

                include: {
                  prescriptionCategory: true,
                  referenceMovement: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  },

  _count: {
    select: {
      results: true,
      scheduledWorkouts: true,
      programTemplateItems: true,
    },
  },
} satisfies Prisma.WorkoutInclude;

type WorkoutWithDetails = Prisma.WorkoutGetPayload<{
  include: typeof workoutInclude;
}>;

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

  findAll(
    user: AuthenticatedUser,
    query: FindWorkoutsQueryDto = {},
  ): Promise<WorkoutResponseDto[] | PaginatedResponse<WorkoutResponseDto>> {
    return this.findWorkoutCollection(user, query, false);
  }

  findArchived(
    user: AuthenticatedUser,
    query: FindWorkoutsQueryDto = {},
  ): Promise<WorkoutResponseDto[] | PaginatedResponse<WorkoutResponseDto>> {
    return this.findWorkoutCollection(user, query, true);
  }

  private async findWorkoutCollection(
    user: AuthenticatedUser,
    query: FindWorkoutsQueryDto,
    archived: boolean,
  ) {
    const normalizedSearch = query.search?.trim();
    const where = {
      ...(archived && user.role !== 'ADMIN'
        ? { createdByUserId: user.userId }
        : {}),
      isActive: !archived,
      ...(query.benchmark === 'true' ? { isBenchmark: true } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: { contains: normalizedSearch, mode: 'insensitive' },
              },
              {
                description: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                type: {
                  name: { contains: normalizedSearch, mode: 'insensitive' },
                },
              },
              {
                variants: {
                  some: {
                    sections: {
                      some: {
                        movements: {
                          some: {
                            movement: {
                              name: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.WorkoutWhereInput;
    const paginationRequested =
      query.page !== undefined || query.pageSize !== undefined;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;

    const [workouts, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        include: workoutInclude,
        orderBy: archived
          ? [{ deactivatedAt: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
        ...(paginationRequested
          ? { skip: (page - 1) * pageSize, take: pageSize }
          : {}),
      }),
      paginationRequested
        ? this.prisma.workout.count({ where })
        : Promise.resolve(0),
    ]);

    const items = workouts.map((workout) => this.mapWorkout(workout, user));
    return paginationRequested
      ? createPaginatedResponse(items, total, page, pageSize)
      : items;
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.prisma.workout.findUnique({
      where: {
        id,
      },

      include: workoutInclude,
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    if (
      !workout.isActive &&
      user.role !== 'ADMIN' &&
      workout.createdByUserId !== user.userId
    ) {
      const historicalResult = await this.prisma.workoutResult.findFirst({
        where: {
          workoutId: id,
          athleteProfile: {
            userId: user.userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!historicalResult) {
        throw new NotFoundException('Workout not found');
      }
    }

    return this.mapWorkout(workout, user);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const workout = await this.findManageableWorkout(id, user);

    if (this.hasDependencies(workout)) {
      throw new ConflictException(
        'Workouts with results, schedules, or program templates cannot be deleted and must be deactivated',
      );
    }

    await this.prisma.workout.delete({
      where: {
        id,
      },
    });

    return {
      id,
      deleted: true,
    };
  }

  async deactivate(
    user: AuthenticatedUser,
    id: string,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.findManageableWorkout(id, user);

    if (!this.hasDependencies(workout)) {
      throw new ConflictException(
        'Workouts without results must be deleted instead of deactivated',
      );
    }

    if (!workout.isActive) {
      return this.mapWorkout(workout, user);
    }

    const updatedWorkout = await this.prisma.workout.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
      include: workoutInclude,
    });

    return this.mapWorkout(updatedWorkout, user);
  }

  async reactivate(
    user: AuthenticatedUser,
    id: string,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.findManageableWorkout(id, user);

    if (workout.isActive) {
      return this.mapWorkout(workout, user);
    }

    const updatedWorkout = await this.prisma.workout.update({
      where: {
        id,
      },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
      include: workoutInclude,
    });

    return this.mapWorkout(updatedWorkout, user);
  }

  async create(user: AuthenticatedUser, dto: CreateWorkoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const workoutType = await tx.workoutType.findUnique({
        where: {
          key: dto.typeKey,
        },
      });

      if (!workoutType) {
        throw new NotFoundException(`Workout type "${dto.typeKey}" not found`);
      }

      if (dto.variants.length === 0) {
        throw new BadRequestException(
          'At least one workout variant is required',
        );
      }

      for (const variant of dto.variants) {
        const level = await tx.workoutLevel.findUnique({
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

            for (const prescription of movement.prescriptions ?? []) {
              const category = await tx.prescriptionCategory.findUnique({
                where: {
                  key: prescription.categoryKey,
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
          isBenchmark: dto.isBenchmark ?? false,

          createdByUser: {
            connect: {
              id: user.userId,
            },
          },

          type: {
            connect: {
              key: dto.typeKey,
            },
          },

          variants: {
            create: dto.variants.map((variant) => ({
              name: variant.name,
              notes: variant.notes,

              level: {
                connect: {
                  key: variant.levelKey,
                },
              },

              sections: {
                create: variant.sections.map((section) => ({
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

                      prescriptions: {
                        create: (movement.prescriptions ?? []).map(
                          (prescription) => ({
                            reps: prescription.reps,
                            weight: prescription.weight,
                            weightUnit: prescription.weightUnit,
                            percentage: prescription.percentage,
                            referenceRepMax: prescription.referenceRepMax,
                            referenceMovement: prescription.referenceMovementId
                              ? {
                                  connect: {
                                    id: prescription.referenceMovementId,
                                  },
                                }
                              : undefined,
                            distance: prescription.distance,
                            calories: prescription.calories,
                            durationSeconds: prescription.durationSeconds,
                            notes: prescription.notes,

                            prescriptionCategory: {
                              connect: {
                                key: prescription.categoryKey,
                              },
                            },
                          }),
                        ),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        },

        include: workoutInclude,
      });
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.findManageableWorkout(id, user);

    if (this.hasDependencies(workout)) {
      throw new ConflictException(
        'Workouts with results, schedules, or program templates cannot be structurally edited',
      );
    }

    const updatedWorkout = await this.prisma.$transaction(async (tx) => {
      await this.validateWorkoutDefinition(tx, dto);

      await tx.workoutVariant.deleteMany({ where: { workoutId: id } });

      return tx.workout.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          isBenchmark: dto.isBenchmark ?? false,
          type: { connect: { key: dto.typeKey } },
          variants: {
            create: dto.variants.map((variant) => ({
              name: variant.name,
              notes: variant.notes,
              level: { connect: { key: variant.levelKey } },
              sections: {
                create: variant.sections.map((section) => ({
                  order: section.order,
                  rounds: section.rounds,
                  durationSeconds: section.durationSeconds,
                  restSeconds: section.restSeconds,
                  repScheme: section.repScheme ?? [],
                  notes: section.notes,
                  type: { connect: { key: section.typeKey } },
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
                      movement: { connect: { id: movement.movementId } },
                      prescriptions: {
                        create: (movement.prescriptions ?? []).map(
                          (prescription) => ({
                            reps: prescription.reps,
                            weight: prescription.weight,
                            weightUnit: prescription.weightUnit,
                            percentage: prescription.percentage,
                            referenceRepMax: prescription.referenceRepMax,
                            referenceMovement: prescription.referenceMovementId
                              ? {
                                  connect: {
                                    id: prescription.referenceMovementId,
                                  },
                                }
                              : undefined,
                            distance: prescription.distance,
                            calories: prescription.calories,
                            durationSeconds: prescription.durationSeconds,
                            notes: prescription.notes,
                            prescriptionCategory: {
                              connect: { key: prescription.categoryKey },
                            },
                          }),
                        ),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        },
        include: workoutInclude,
      });
    });

    return this.mapWorkout(updatedWorkout, user);
  }

  private async findManageableWorkout(id: string, user: AuthenticatedUser) {
    const workout = await this.prisma.workout.findUnique({
      where: {
        id,
      },
      include: workoutInclude,
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const canManage =
      user.role === 'ADMIN' ||
      (!workout.official && workout.createdByUserId === user.userId);

    if (!canManage) {
      throw new ForbiddenException('You cannot manage this workout');
    }

    return workout;
  }

  private hasDependencies(workout: WorkoutWithDetails) {
    return (
      workout._count.results > 0 ||
      workout._count.scheduledWorkouts > 0 ||
      workout._count.programTemplateItems > 0
    );
  }

  private async validateWorkoutDefinition(
    tx: Prisma.TransactionClient,
    dto: CreateWorkoutDto,
  ) {
    const workoutType = await tx.workoutType.findUnique({
      where: { key: dto.typeKey },
    });
    if (!workoutType) {
      throw new NotFoundException(`Workout type "${dto.typeKey}" not found`);
    }
    if (dto.variants.length === 0) {
      throw new BadRequestException('At least one workout variant is required');
    }

    for (const variant of dto.variants) {
      const level = await tx.workoutLevel.findUnique({
        where: { key: variant.levelKey },
      });
      if (!level) {
        throw new NotFoundException(
          `Workout level "${variant.levelKey}" not found`,
        );
      }
      for (const section of variant.sections) {
        const sectionType = await tx.workoutType.findUnique({
          where: { key: section.typeKey },
        });
        if (!sectionType) {
          throw new NotFoundException(
            `Workout section type "${section.typeKey}" not found`,
          );
        }
        for (const movement of section.movements) {
          const existingMovement = await tx.movement.findUnique({
            where: { id: movement.movementId },
          });
          if (!existingMovement) {
            throw new NotFoundException(
              `Movement "${movement.movementId}" not found`,
            );
          }
          for (const prescription of movement.prescriptions ?? []) {
            const category = await tx.prescriptionCategory.findUnique({
              where: { key: prescription.categoryKey },
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
  }

  private mapWorkout(
    workout: WorkoutWithDetails,
    user: AuthenticatedUser,
  ): WorkoutResponseDto {
    const canManage =
      user.role === 'ADMIN' ||
      (!workout.official && workout.createdByUserId === user.userId);
    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      isBenchmark: workout.isBenchmark,
      official: workout.official,
      isActive: workout.isActive,
      deactivatedAt: workout.deactivatedAt,
      resultCount: workout._count.results,
      canManage,
      canEdit: canManage && !this.hasDependencies(workout),
      canDelete: canManage && !this.hasDependencies(workout),
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,

      type: {
        key: workout.type.key,
        name: workout.type.name,

        defaultResultType: workout.type.defaultResultType
          ? {
              key: workout.type.defaultResultType.key,
              name: workout.type.defaultResultType.name,
            }
          : null,
      },

      createdByUser: {
        id: workout.createdByUser.id,
        email: workout.createdByUser.email,
      },

      variants: workout.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        notes: variant.notes,

        level: {
          key: variant.level.key,
          name: variant.level.name,
        },

        sections: variant.sections.map((section) => ({
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

            defaultResultType: section.type.defaultResultType
              ? {
                  key: section.type.defaultResultType.key,
                  name: section.type.defaultResultType.name,
                }
              : null,
          },

          movements: section.movements.map((item) => ({
            id: item.id,
            order: item.order,
            reps: item.reps,

            weight: item.weight !== null ? Number(item.weight) : null,

            weightUnit: item.weightUnit,
            distance: item.distance,
            calories: item.calories,
            durationSeconds: item.durationSeconds,
            notes: item.notes,

            movement: {
              id: item.movement.id,
              name: item.movement.name,

              measurementTypes: item.movement.measurementTypes.map(
                (itemMeasurementType) => ({
                  key: itemMeasurementType.measurementType.key,
                  name: itemMeasurementType.measurementType.name,
                }),
              ),
            },

            prescriptions: item.prescriptions.map((prescription) => ({
              id: prescription.id,

              category: {
                key: prescription.prescriptionCategory.key,
                name: prescription.prescriptionCategory.name,
              },

              reps: prescription.reps,

              weight:
                prescription.weight !== null
                  ? Number(prescription.weight)
                  : null,

              weightUnit: prescription.weightUnit,
              percentage:
                prescription.percentage !== null
                  ? Number(prescription.percentage)
                  : null,
              referenceRepMax: prescription.referenceRepMax,
              referenceMovement: prescription.referenceMovement,
              distance: prescription.distance,
              calories: prescription.calories,
              durationSeconds: prescription.durationSeconds,
              notes: prescription.notes,
            })),
          })),
        })),
      })),
    };
  }
}
