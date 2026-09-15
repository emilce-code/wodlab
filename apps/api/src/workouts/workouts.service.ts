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
  box: {
    select: {
      id: true,
      name: true,
    },
  },
  sourceWorkout: {
    select: {
      id: true,
      name: true,
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
                  referenceMovement: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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
      classSessions: true,
    },
  },
} satisfies Prisma.WorkoutInclude;

type WorkoutWithDetails = Prisma.WorkoutGetPayload<{
  include: typeof workoutInclude;
}>;

type CatalogContext = {
  userId: string;
  appRole: 'USER' | 'COACH' | 'ADMIN';
  activeBoxId: string | null;
  activeBoxName: string | null;
  activeBoxRole: 'OWNER' | 'COACH' | 'ATHLETE' | null;
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
    const context = await this.getCatalogContext(user);
    const normalizedSearch = query.search?.trim();

    const visibility = this.collectionVisibilityWhere(
      context,
      archived,
      query.scope ?? 'all',
    );

    const where = {
      AND: [
        visibility,
        {
          isActive: !archived,
        },
        ...(query.benchmark === 'true' ? [{ isBenchmark: true }] : []),
        ...(normalizedSearch
          ? [
              {
                OR: [
                  {
                    name: {
                      contains: normalizedSearch,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    description: {
                      contains: normalizedSearch,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    type: {
                      name: {
                        contains: normalizedSearch,
                        mode: 'insensitive' as const,
                      },
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
                                    mode: 'insensitive' as const,
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
              },
            ]
          : []),
      ],
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
          ? {
              skip: (page - 1) * pageSize,
              take: pageSize,
            }
          : {}),
      }),
      paginationRequested
        ? this.prisma.workout.count({ where })
        : Promise.resolve(0),
    ]);

    const items = workouts.map((workout) =>
      this.mapWorkout(workout, context),
    );

    return paginationRequested
      ? createPaginatedResponse(items, total, page, pageSize)
      : items;
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<WorkoutResponseDto> {
    const context = await this.getCatalogContext(user);
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: workoutInclude,
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    if (!this.canViewWorkout(workout, context)) {
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

    return this.mapWorkout(workout, context);
  }

  async create(user: AuthenticatedUser, dto: CreateWorkoutDto) {
    const context = await this.getCatalogContext(user);
    const target = this.resolveCreationScope(context);

    const workout = await this.prisma.$transaction(async (tx) => {
      await this.validateWorkoutDefinition(tx, dto);
      const workoutType = await tx.workoutType.findUnique({
        where: { key: dto.typeKey },
        select: { id: true },
      });
      if (!workoutType) {
        throw new NotFoundException(`Workout type \"${dto.typeKey}\" not found`);
      }

      return tx.workout.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isBenchmark: dto.isBenchmark ?? false,
          official: false,
          scope: target.scope,
          boxId: target.boxId,
          createdByUserId: user.userId,
          typeId: workoutType.id,
          variants: {
            create: this.variantCreateData(dto),
          },
        },
        include: workoutInclude,
      });
    });

    return this.mapWorkout(workout, context);
  }

  async copyGlobalToActiveBox(
    user: AuthenticatedUser,
    sourceWorkoutId: string,
  ): Promise<WorkoutResponseDto> {
    const context = await this.getCatalogContext(user);

    if (!context.activeBoxId || !this.canManageActiveBox(context)) {
      throw new ForbiddenException(
        'Active Box owner or coach access is required to copy a workout',
      );
    }

    const source = await this.prisma.workout.findFirst({
      where: {
        id: sourceWorkoutId,
        scope: 'GLOBAL',
        isActive: true,
      },
      include: workoutInclude,
    });

    if (!source) {
      throw new NotFoundException('Global workout not found');
    }

    const copy = await this.prisma.workout.create({
      data: {
        name: source.name,
        description: source.description,
        typeId: source.typeId,
        createdByUserId: user.userId,
        scope: 'BOX',
        boxId: context.activeBoxId,
        sourceWorkoutId: source.id,
        isBenchmark: source.isBenchmark,
        official: false,
        variants: {
          create: source.variants.map((variant) => ({
            levelId: variant.levelId,
            name: variant.name,
            notes: variant.notes,
            sections: {
              create: variant.sections.map((section) => ({
                typeId: section.typeId,
                order: section.order,
                rounds: section.rounds,
                durationSeconds: section.durationSeconds,
                restSeconds: section.restSeconds,
                notes: section.notes,
                repScheme: section.repScheme,
                movements: {
                  create: section.movements.map((item) => ({
                    movementId: item.movementId,
                    order: item.order,
                    reps: item.reps,
                    weight: item.weight,
                    weightUnit: item.weightUnit,
                    distance: item.distance,
                    calories: item.calories,
                    durationSeconds: item.durationSeconds,
                    notes: item.notes,
                    prescriptions: {
                      create: item.prescriptions.map((prescription) => ({
                        prescriptionCategoryId:
                          prescription.prescriptionCategoryId,
                        reps: prescription.reps,
                        weight: prescription.weight,
                        weightUnit: prescription.weightUnit,
                        percentage: prescription.percentage,
                        referenceRepMax: prescription.referenceRepMax,
                        referenceMovementId:
                          prescription.referenceMovement?.id ?? null,
                        distance: prescription.distance,
                        calories: prescription.calories,
                        durationSeconds: prescription.durationSeconds,
                        notes: prescription.notes,
                      })),
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

    return this.mapWorkout(copy, context);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const context = await this.getCatalogContext(user);
    const workout = await this.findManageableWorkout(id, context);

    if (this.hasDependencies(workout)) {
      throw new ConflictException(
        'Workouts with results, schedules, classes, or program templates cannot be structurally edited',
      );
    }

    const updatedWorkout = await this.prisma.$transaction(async (tx) => {
      await this.validateWorkoutDefinition(tx, dto);

      await tx.workoutVariant.deleteMany({
        where: {
          workoutId: id,
        },
      });

      return tx.workout.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isBenchmark: dto.isBenchmark ?? false,
          type: {
            connect: {
              key: dto.typeKey,
            },
          },
          variants: {
            create: this.variantCreateData(dto),
          },
        },
        include: workoutInclude,
      });
    });

    return this.mapWorkout(updatedWorkout, context);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const context = await this.getCatalogContext(user);
    const workout = await this.findManageableWorkout(id, context);

    if (this.hasDependencies(workout)) {
      throw new ConflictException(
        'Workouts with results, schedules, classes, or program templates cannot be deleted. Archive the workout instead.',
      );
    }

    await this.prisma.workout.delete({
      where: { id },
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
    const context = await this.getCatalogContext(user);
    const workout = await this.findManageableWorkout(id, context);

    if (!workout.isActive) {
      return this.mapWorkout(workout, context);
    }

    const updatedWorkout = await this.prisma.workout.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
      include: workoutInclude,
    });

    return this.mapWorkout(updatedWorkout, context);
  }

  async reactivate(
    user: AuthenticatedUser,
    id: string,
  ): Promise<WorkoutResponseDto> {
    const context = await this.getCatalogContext(user);
    const workout = await this.findManageableWorkout(id, context);

    if (workout.isActive) {
      return this.mapWorkout(workout, context);
    }

    const updatedWorkout = await this.prisma.workout.update({
      where: { id },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
      include: workoutInclude,
    });

    return this.mapWorkout(updatedWorkout, context);
  }

  private async getCatalogContext(
    user: AuthenticatedUser,
  ): Promise<CatalogContext> {
    const dbUser = await this.prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        role: true,
        activeBoxId: true,
        activeBox: {
          select: {
            name: true,
          },
        },
        boxMemberships: {
          select: {
            boxId: true,
            role: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const activeMembership = dbUser.activeBoxId
      ? dbUser.boxMemberships.find(
          (membership) => membership.boxId === dbUser.activeBoxId,
        )
      : null;

    return {
      userId: user.userId,
      appRole: dbUser.role,
      activeBoxId: activeMembership ? dbUser.activeBoxId : null,
      activeBoxName: activeMembership ? dbUser.activeBox?.name ?? null : null,
      activeBoxRole: activeMembership?.role ?? null,
    };
  }

  private resolveCreationScope(context: CatalogContext): {
    scope: 'GLOBAL' | 'BOX' | 'PERSONAL';
    boxId: string | null;
  } {
    if (context.activeBoxId && this.canManageActiveBox(context)) {
      return {
        scope: 'BOX',
        boxId: context.activeBoxId,
      };
    }

    if (context.appRole === 'ADMIN') {
      return {
        scope: 'GLOBAL',
        boxId: null,
      };
    }

    return {
      scope: 'PERSONAL',
      boxId: null,
    };
  }

  private collectionVisibilityWhere(
    context: CatalogContext,
    archived: boolean,
    scope: 'all' | 'mine' | 'global' | 'box' | 'personal',
  ): Prisma.WorkoutWhereInput {
    const globalVisible: Prisma.WorkoutWhereInput =
      !archived || context.appRole === 'ADMIN'
        ? { scope: 'GLOBAL' }
        : { id: '__never__' };

    const boxVisible: Prisma.WorkoutWhereInput =
      context.activeBoxId &&
      (!archived || this.canManageActiveBox(context))
        ? {
            scope: 'BOX',
            boxId: context.activeBoxId,
          }
        : { id: '__never__' };

    const personalVisible: Prisma.WorkoutWhereInput = {
      scope: 'PERSONAL',
      createdByUserId: context.userId,
    };

    const allVisible: Prisma.WorkoutWhereInput = {
      OR: [globalVisible, boxVisible, personalVisible],
    };

    if (scope === 'mine') {
      return {
        AND: [
          allVisible,
          {
            createdByUserId: context.userId,
          },
        ],
      };
    }

    if (scope === 'global') {
      return globalVisible;
    }

    if (scope === 'box') {
      return boxVisible;
    }

    if (scope === 'personal') {
      return personalVisible;
    }

    return allVisible;
  }

  private canViewWorkout(
    workout: WorkoutWithDetails,
    context: CatalogContext,
  ) {
    if (workout.scope === 'GLOBAL') {
      return workout.isActive || context.appRole === 'ADMIN';
    }

    if (workout.scope === 'PERSONAL') {
      return workout.createdByUserId === context.userId;
    }

    if (workout.scope === 'BOX') {
      return (
        context.activeBoxId === workout.boxId &&
        context.activeBoxRole !== null &&
        (workout.isActive || this.canManageActiveBox(context))
      );
    }

    return false;
  }

  private canManageActiveBox(context: CatalogContext) {
    if (!context.activeBoxId) {
      return false;
    }

    if (context.appRole === 'ADMIN') {
      return true;
    }

    return (
      context.activeBoxRole === 'OWNER' || context.activeBoxRole === 'COACH'
    );
  }

  private canManageWorkout(
    workout: WorkoutWithDetails,
    context: CatalogContext,
  ) {
    if (workout.scope === 'GLOBAL') {
      return context.appRole === 'ADMIN';
    }

    if (workout.scope === 'PERSONAL') {
      return workout.createdByUserId === context.userId;
    }

    return (
      workout.scope === 'BOX' &&
      workout.boxId === context.activeBoxId &&
      this.canManageActiveBox(context)
    );
  }

  private async findManageableWorkout(
    id: string,
    context: CatalogContext,
  ): Promise<WorkoutWithDetails> {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: workoutInclude,
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    if (!this.canManageWorkout(workout, context)) {
      throw new ForbiddenException('You cannot manage this workout');
    }

    return workout;
  }

  private hasDependencies(workout: WorkoutWithDetails) {
    return (
      workout._count.results > 0 ||
      workout._count.scheduledWorkouts > 0 ||
      workout._count.programTemplateItems > 0 ||
      workout._count.classSessions > 0
    );
  }

  private async validateWorkoutDefinition(
    tx: Prisma.TransactionClient,
    dto: CreateWorkoutDto | UpdateWorkoutDto,
  ) {
    const workoutType = await tx.workoutType.findUnique({
      where: {
        key: dto.typeKey,
      },
      select: {
        id: true,
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

    const levelKeys = new Set<string>();

    for (const variant of dto.variants) {
      if (levelKeys.has(variant.levelKey)) {
        throw new BadRequestException(
          `Workout level "${variant.levelKey}" can only be used once`,
        );
      }
      levelKeys.add(variant.levelKey);

      const level = await tx.workoutLevel.findUnique({
        where: {
          key: variant.levelKey,
        },
        select: {
          id: true,
        },
      });

      if (!level) {
        throw new NotFoundException(
          `Workout level "${variant.levelKey}" not found`,
        );
      }

      if (variant.sections.length === 0) {
        throw new BadRequestException(
          `Variant "${variant.levelKey}" requires at least one section`,
        );
      }

      for (const section of variant.sections) {
        const sectionType = await tx.workoutType.findUnique({
          where: {
            key: section.typeKey,
          },
          select: {
            id: true,
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
            select: {
              id: true,
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
              select: {
                id: true,
              },
            });

            if (!category) {
              throw new NotFoundException(
                `Prescription category "${prescription.categoryKey}" not found`,
              );
            }

            if (prescription.referenceMovementId) {
              const referenceMovement = await tx.movement.findUnique({
                where: {
                  id: prescription.referenceMovementId,
                },
                select: {
                  id: true,
                },
              });

              if (!referenceMovement) {
                throw new NotFoundException(
                  `Reference movement "${prescription.referenceMovementId}" not found`,
                );
              }
            }
          }
        }
      }
    }
  }

  private variantCreateData(dto: CreateWorkoutDto | UpdateWorkoutDto) {
    return dto.variants.map((variant) => ({
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
    }));
  }

  private mapWorkout(
    workout: WorkoutWithDetails,
    context: CatalogContext,
  ): WorkoutResponseDto {
    const canManage = this.canManageWorkout(workout, context);
    const hasDependencies = this.hasDependencies(workout);

    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      scope: workout.scope,
      box: workout.box,
      sourceWorkout: workout.sourceWorkout,
      isBenchmark: workout.isBenchmark,
      official: workout.official,
      isActive: workout.isActive,
      deactivatedAt: workout.deactivatedAt,
      resultCount: workout._count.results,
      canManage,
      canEdit: canManage && !hasDependencies,
      canDelete: canManage && !hasDependencies,
      canCopyToBox:
        workout.scope === 'GLOBAL' &&
        workout.isActive &&
        this.canManageActiveBox(context),
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
      type: {
        key: workout.type.key,
        name: workout.type.name,
        defaultResultType: workout.type.defaultResultType,
      },
      createdByUser: workout.createdByUser,
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
            defaultResultType: section.type.defaultResultType,
          },
          movements: section.movements.map((item) => ({
            id: item.id,
            order: item.order,
            reps: item.reps,
            weight: item.weight === null ? null : Number(item.weight),
            weightUnit: item.weightUnit,
            distance: item.distance,
            calories: item.calories,
            durationSeconds: item.durationSeconds,
            notes: item.notes,
            movement: {
              id: item.movement.id,
              name: item.movement.name,
              measurementTypes: item.movement.measurementTypes.map(
                ({ measurementType }) => ({
                  key: measurementType.key,
                  name: measurementType.name,
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
                prescription.weight === null
                  ? null
                  : Number(prescription.weight),
              weightUnit: prescription.weightUnit,
              percentage:
                prescription.percentage === null
                  ? null
                  : Number(prescription.percentage),
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
