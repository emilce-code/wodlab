import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateMovementResultDto } from './dto/create-movement-result.dto';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { MovementResponseDto } from './dto/movement-response.dto';

@Injectable()
export class MovementsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    query: FindMovementsQueryDto,
  ): Promise<MovementResponseDto[]> {
    const {
      search,
      category,
      measurementType,
      foundational,
    } = query;

    const normalizedSearch =
      search?.trim().toLowerCase();

    const movements =
      await this.prisma.movement.findMany({
        where: {
          ...(normalizedSearch
            ? {
                searchText: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              }
            : {}),

          ...(category
            ? {
                category: {
                  key: category,
                },
              }
            : {}),

          ...(measurementType
            ? {
                measurementTypes: {
                  some: {
                    measurementType: {
                      key: measurementType,
                    },
                  },
                },
              }
            : {}),

          ...(foundational === 'true'
            ? {
                isFoundational: true,
              }
            : {}),
        },

        include: {
          category: true,

          measurementTypes: {
            include: {
              measurementType: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      });

    return movements.map(
      (movement) =>
        this.mapMovement(movement),
    );
  }

  async findOne(
    movementId: string,
  ): Promise<MovementResponseDto> {
    const movement =
      await this.prisma.movement.findUnique({
        where: {
          id: movementId,
        },

        include: {
          category: true,

          measurementTypes: {
            include: {
              measurementType: true,
            },

            orderBy: {
              measurementType: {
                sortOrder: 'asc',
              },
            },
          },
        },
      });

    if (!movement) {
      throw new NotFoundException(
        'Movement not found',
      );
    }

    return this.mapMovement(
      movement,
    );
  }

  findCategories() {
    return this.prisma.movementCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },

      select: {
        key: true,
        name: true,
      },
    });
  }

  findMeasurementTypes() {
    return this.prisma.measurementType.findMany({
      orderBy: {
        sortOrder: 'asc',
      },

      select: {
        key: true,
        name: true,
      },
    });
  }

  async createResult(
    movementId: string,
    userId: string,
    dto: CreateMovementResultDto,
  ) {
    const athleteProfile =
      await this.getAthleteProfile(
        userId,
      );

    const movement =
      await this.prisma.movement.findUnique({
        where: {
          id: movementId,
        },

        include: {
          measurementTypes: {
            include: {
              measurementType: true,
            },
          },
        },
      });

    if (!movement) {
      throw new NotFoundException(
        'Movement not found',
      );
    }

    const measurementType =
      movement.measurementTypes
        .map(
          (item) =>
            item.measurementType,
        )
        .find(
          (type) =>
            type.key ===
            dto.measurementTypeKey,
        );

    if (!measurementType) {
      throw new BadRequestException(
        `Measurement type "${dto.measurementTypeKey}" is not supported by this movement`,
      );
    }

    this.validateResult(
      measurementType.key,
      dto,
    );

    return this.prisma.movementResult.create({
      data: {
        movementId:
          movement.id,

        athleteProfileId:
          athleteProfile.id,

        measurementTypeId:
          measurementType.id,

        performedAt:
          new Date(
            dto.performedAt,
          ),

        reps:
          dto.reps,

        load:
          dto.load,

        weightUnit:
          dto.load !== undefined
            ? dto.weightUnit ??
              athleteProfile.preferredWeightUnit
            : undefined,

        distance:
          dto.distance,

        durationSeconds:
          dto.durationSeconds,

        calories:
          dto.calories,

        notes:
          dto.notes?.trim() ||
          undefined,
      },

      include: {
        measurementType:
          true,

        movement: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findResults(
    movementId: string,
    userId: string,
  ) {
    const athleteProfile =
      await this.getAthleteProfile(
        userId,
      );

    await this.ensureMovementExists(
      movementId,
    );

    return this.prisma.movementResult.findMany({
      where: {
        movementId,

        athleteProfileId:
          athleteProfile.id,
      },

      include: {
        measurementType: {
          select: {
            key: true,
            name: true,
          },
        },
      },

      orderBy: [
        {
          performedAt: 'desc',
        },

        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findResultSummary(
    movementId: string,
    userId: string,
  ) {
    const athleteProfile =
      await this.getAthleteProfile(
        userId,
      );

    const movement =
      await this.prisma.movement.findUnique({
        where: {
          id: movementId,
        },

        include: {
          measurementTypes: {
            include: {
              measurementType: true,
            },

            orderBy: {
              measurementType: {
                sortOrder: 'asc',
              },
            },
          },
        },
      });

    if (!movement) {
      throw new NotFoundException(
        'Movement not found',
      );
    }

    const results =
      await this.prisma.movementResult.findMany({
        where: {
          movementId,

          athleteProfileId:
            athleteProfile.id,
        },

        include: {
          measurementType: true,
        },

        orderBy: [
          {
            performedAt: 'desc',
          },

          {
            createdAt: 'desc',
          },
        ],
      });

    const personalRecords =
      movement.measurementTypes.map(
        (item) => {
          const type =
            item.measurementType;

          const matchingResults =
            results.filter(
              (result) =>
                result
                  .measurementType
                  .key ===
                type.key,
            );

          if (
            type.key ===
            'WEIGHT'
          ) {
            const byReps =
              new Map<
                number,
                typeof matchingResults
              >();

            for (const result of matchingResults) {
              if (
                result.reps ===
                null
              ) {
                continue;
              }

              const reps =
                result.reps;

              const current =
                byReps.get(
                  reps,
                ) ?? [];

              current.push(
                result,
              );

              byReps.set(
                reps,
                current,
              );
            }

            const records =
              Array.from(
                byReps.entries(),
              )
                .map(
                  ([
                    reps,
                    repResults,
                  ]) => {
                    const best =
                      repResults.reduce(
                        (
                          currentBest,
                          candidate,
                        ) => {
                          if (
                            !currentBest
                          ) {
                            return candidate;
                          }

                          const currentLoad =
                            this.getLoadInKg(
                              currentBest.load,
                              currentBest.weightUnit,
                            );

                          const candidateLoad =
                            this.getLoadInKg(
                              candidate.load,
                              candidate.weightUnit,
                            );

                          return candidateLoad >
                            currentLoad
                            ? candidate
                            : currentBest;
                        },
                        undefined as
                          | (typeof repResults)[number]
                          | undefined,
                      );

                    return {
                      reps,

                      result:
                        best ??
                        null,
                    };
                  },
                )
                .sort(
                  (a, b) =>
                    a.reps -
                    b.reps,
                );

            return {
              measurementType: {
                key:
                  type.key,

                name:
                  type.name,
              },

              records,
            };
          }

          const best =
            this.getBestResult(
              type.key,
              matchingResults,
            );

          return {
            measurementType: {
              key:
                type.key,

              name:
                type.name,
            },

            result:
              best,
          };
        },
      );

    return {
      movement: {
        id:
          movement.id,

        name:
          movement.name,
      },

      totalResults:
        results.length,

      lastResult:
        results[0] ??
        null,

      personalRecords,
    };
  }

  private mapMovement(
    movement: {
      id: string;
      name: string;
      aliases: string[];
      isFoundational: boolean;
      official: boolean;

      category: {
        key: string;
        name: string;
      };

      measurementTypes: {
        measurementType: {
          key: string;
          name: string;
        };
      }[];
    },
  ): MovementResponseDto {
    return {
      id:
        movement.id,

      name:
        movement.name,

      category: {
        key:
          movement.category.key,

        name:
          movement.category.name,
      },

      measurementTypes:
        movement.measurementTypes.map(
          (item) => ({
            key:
              item
                .measurementType
                .key,

            name:
              item
                .measurementType
                .name,
          }),
        ),

      isFoundational:
        movement.isFoundational,

      official:
        movement.official,

      aliases:
        movement.aliases,
    };
  }

  private async getAthleteProfile(
    userId: string,
  ) {
    const athleteProfile =
      await this.prisma.athleteProfile.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,

          preferredWeightUnit:
            true,
        },
      });

    if (!athleteProfile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    return athleteProfile;
  }

  private async ensureMovementExists(
    movementId: string,
  ) {
    const movement =
      await this.prisma.movement.findUnique({
        where: {
          id: movementId,
        },

        select: {
          id: true,
        },
      });

    if (!movement) {
      throw new NotFoundException(
        'Movement not found',
      );
    }
  }

  private validateResult(
    measurementTypeKey: string,
    dto: CreateMovementResultDto,
  ) {
    switch (
      measurementTypeKey
    ) {
      case 'REPS':
        if (
          dto.reps ===
          undefined
        ) {
          throw new BadRequestException(
            'Reps are required for a repetitions result',
          );
        }

        break;

      case 'WEIGHT':
        if (
          dto.load ===
          undefined
        ) {
          throw new BadRequestException(
            'Load is required for a weight result',
          );
        }

        if (
          dto.reps ===
          undefined
        ) {
          throw new BadRequestException(
            'Reps are required for a weight result',
          );
        }

        break;

      case 'DISTANCE':
        if (
          dto.distance ===
          undefined
        ) {
          throw new BadRequestException(
            'Distance is required for a distance result',
          );
        }

        break;

      case 'DURATION':
        if (
          dto.durationSeconds ===
          undefined
        ) {
          throw new BadRequestException(
            'Duration is required for a duration result',
          );
        }

        break;

      case 'CALORIES':
        if (
          dto.calories ===
          undefined
        ) {
          throw new BadRequestException(
            'Calories are required for a calories result',
          );
        }

        break;

      default:
        throw new BadRequestException(
          `Unsupported measurement type "${measurementTypeKey}"`,
        );
    }
  }

  private getLoadInKg(
    load: unknown,
    weightUnit:
      | 'KG'
      | 'LB'
      | null,
  ) {
    const value =
      Number(
        load ?? 0,
      );

    if (
      weightUnit ===
      'LB'
    ) {
      return (
        value *
        0.45359237
      );
    }

    return value;
  }

  private getBestResult<
    T extends {
      reps: number | null;
      distance: number | null;
      durationSeconds:
        | number
        | null;
      calories: number | null;
    },
  >(
    measurementTypeKey: string,
    results: T[],
  ): T | null {
    if (
      results.length ===
      0
    ) {
      return null;
    }

    return results.reduce(
      (
        best,
        candidate,
      ) => {
        switch (
          measurementTypeKey
        ) {
          case 'REPS':
            return (
              candidate.reps ??
              0
            ) >
              (best.reps ??
                0)
              ? candidate
              : best;

          case 'DISTANCE':
            return (
              candidate.distance ??
              0
            ) >
              (best.distance ??
                0)
              ? candidate
              : best;

          case 'DURATION':
            return (
              candidate.durationSeconds ??
              Number.MAX_SAFE_INTEGER
            ) <
              (best.durationSeconds ??
                Number.MAX_SAFE_INTEGER)
              ? candidate
              : best;

          case 'CALORIES':
            return (
              candidate.calories ??
              0
            ) >
              (best.calories ??
                0)
              ? candidate
              : best;

          default:
            return best;
        }
      },
    );
  }
}