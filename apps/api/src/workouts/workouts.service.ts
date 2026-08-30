import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
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
                },
              },
            },
          },
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
              id: userId,
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

      variants: workout.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        notes: variant.notes,

        level: {
          key: variant.level.key,
          name: variant.level.name,
        },

        sections: variant.sections.map((section: any) => ({
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

          movements: section.movements.map((item: any) => ({
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
                (itemMeasurementType: any) => ({
                  key: itemMeasurementType.measurementType.key,
                  name: itemMeasurementType.measurementType.name,
                }),
              ),
            },

            prescriptions: item.prescriptions.map((prescription: any) => ({
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
              distance: prescription.distance,
              calories: prescription.calories,
              durationSeconds: prescription.durationSeconds,
              notes: prescription.notes,
            })),
          })),
        })),
      })),
    } as WorkoutResponseDto;
  }
}
