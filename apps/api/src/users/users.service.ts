import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type Auth0UserInput = {
  auth0UserId: string;
  email: string;
  displayName: string;
};

type WeightUnit =
  | 'KG'
  | 'LB'
  | null;

type MovementPrState = {
  value: number;
};

const athleteProfileInclude = {
  preferredWorkoutLevel: true,
  preferredPrescriptionCategory: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findById(
    id: string,
  ) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },

      include: {
        athleteProfile: {
          include:
            athleteProfileInclude,
        },
      },
    });
  }

  findByEmail(
    email: string,
  ) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },

      include: {
        athleteProfile: {
          include:
            athleteProfileInclude,
        },
      },
    });
  }

  findByAuth0UserId(
    auth0UserId: string,
  ) {
    return this.prisma.user.findUnique({
      where: {
        auth0UserId,
      },

      include: {
        athleteProfile: {
          include:
            athleteProfileInclude,
        },
      },
    });
  }

  async findOrCreateFromAuth0(
    input: Auth0UserInput,
  ) {
    const existingUser =
      await this.findByAuth0UserId(
        input.auth0UserId,
      );

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        auth0UserId:
          input.auth0UserId,

        email:
          input.email,

        athleteProfile: {
          create: {
            displayName:
              input.displayName,
          },
        },
      },

      include: {
        athleteProfile: {
          include:
            athleteProfileInclude,
        },
      },
    });
  }

  async getDashboard(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          email: true,

          athleteProfile: {
            select: {
              id: true,
              displayName: true,
              preferredWeightUnit:
                true,
            },
          },
        },
      });

    if (
      !user ||
      !user.athleteProfile
    ) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    const athleteProfile =
      user.athleteProfile;

    const now =
      new Date();

    const monthStart =
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0,
          0,
          0,
          0,
        ),
      );

    const nextMonthStart =
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() +
            1,
          1,
          0,
          0,
          0,
          0,
        ),
      );

    const [
      monthlyWorkoutResultCount,
      monthlyMovementResultCount,
      uniqueMovementRows,
      recentWorkoutResults,
      recentMovementResults,
      allMovementResults,
    ] =
      await Promise.all([
        this.prisma.workoutResult.count({
          where: {
            athleteProfileId:
              athleteProfile.id,

            performedAt: {
              gte:
                monthStart,

              lt:
                nextMonthStart,
            },
          },
        }),

        this.prisma.movementResult.count({
          where: {
            athleteProfileId:
              athleteProfile.id,

            performedAt: {
              gte:
                monthStart,

              lt:
                nextMonthStart,
            },
          },
        }),

        this.prisma.movementResult.findMany({
          where: {
            athleteProfileId:
              athleteProfile.id,
          },

          distinct: [
            'movementId',
          ],

          select: {
            movementId:
              true,
          },
        }),

        this.prisma.workoutResult.findMany({
          where: {
            athleteProfileId:
              athleteProfile.id,
          },

          take: 6,

          orderBy: [
            {
              performedAt:
                'desc',
            },

            {
              createdAt:
                'desc',
            },
          ],

          include: {
            workout: {
              select: {
                id: true,
                name: true,

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

            resultType: {
              select: {
                key: true,
                name: true,
              },
            },
          },
        }),

        this.prisma.movementResult.findMany({
          where: {
            athleteProfileId:
              athleteProfile.id,
          },

          take: 6,

          orderBy: [
            {
              performedAt:
                'desc',
            },

            {
              createdAt:
                'desc',
            },
          ],

          include: {
            movement: {
              select: {
                id: true,
                name: true,

                category: {
                  select: {
                    key: true,
                    name: true,
                  },
                },
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

        this.prisma.movementResult.findMany({
          where: {
            athleteProfileId:
              athleteProfile.id,
          },

          include: {
            movement: {
              select: {
                id: true,
                name: true,
              },
            },

            measurementType: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },

          orderBy: [
            {
              performedAt:
                'asc',
            },

            {
              createdAt:
                'asc',
            },
          ],
        }),
      ]);

    const monthlyPersonalRecords =
      this.countPersonalRecordsInPeriod(
        allMovementResults,
        monthStart,
        nextMonthStart,
      );

    const workoutActivity =
      recentWorkoutResults.map(
        (result) => ({
          id:
            result.id,

          type:
            'WORKOUT' as const,

          performedAt:
            result.performedAt,

          href:
            `/workouts/${result.workout.id}`,

          title:
            result.workout.name,

          subtitle: {
            key:
              result.workout.type.key,

            name:
              result.workout.type.name,
          },

          result:
            this.mapWorkoutResultValue(
              result,
            ),

          badge:
            result.workoutVariant
              ? {
                  key:
                    result
                      .workoutVariant
                      .level.key,

                  name:
                    result
                      .workoutVariant
                      .level.name,
                }
              : null,

          prescriptionCategory:
            result.prescriptionCategory
              ? {
                  key:
                    result
                      .prescriptionCategory
                      .key,

                  name:
                    result
                      .prescriptionCategory
                      .name,
                }
              : null,
        }),
      );

    const movementActivity =
      recentMovementResults.map(
        (result) => ({
          id:
            result.id,

          type:
            'MOVEMENT' as const,

          performedAt:
            result.performedAt,

          href:
            `/movements/${result.movement.id}`,

          title:
            result.movement.name,

          subtitle: {
            key:
              result
                .measurementType
                .key,

            name:
              result
                .measurementType
                .name,
          },

          result:
            this.mapMovementResultValue(
              result,
            ),

          badge:
            result
                .measurementType
                .key ===
              'WEIGHT' &&
            result.reps !==
              null
              ? {
                  key:
                    `${result.reps}RM`,

                  name:
                    `${result.reps}RM`,
                }
              : null,

          category: {
            key:
              result
                .movement
                .category
                .key,

            name:
              result
                .movement
                .category
                .name,
          },
        }),
      );

    const recentActivity =
      [
        ...workoutActivity,
        ...movementActivity,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.performedAt,
            ).getTime() -
            new Date(
              a.performedAt,
            ).getTime(),
        )
        .slice(
          0,
          6,
        );

    return {
      profile: {
        displayName:
          athleteProfile.displayName,

        email:
          user.email,

        preferredWeightUnit:
          athleteProfile.preferredWeightUnit,
      },

      currentMonth: {
        workoutResults:
          monthlyWorkoutResultCount,

        movementResults:
          monthlyMovementResultCount,

        personalRecords:
          monthlyPersonalRecords,
      },

      overall: {
        movementsTracked:
          uniqueMovementRows.length,
      },

      recentActivity,
    };
  }

  private countPersonalRecordsInPeriod<
    T extends {
      movementId: string;

      measurementType: {
        id: string;
        key: string;
      };

      reps:
        | number
        | null;

      load:
        | unknown
        | null;

      weightUnit:
        | WeightUnit;

      distance:
        | number
        | null;

      durationSeconds:
        | number
        | null;

      calories:
        | number
        | null;

      performedAt:
        Date;
    },
  >(
    results: T[],
    startDate: Date,
    endDate: Date,
  ) {
    const bestByTrack =
      new Map<
        string,
        MovementPrState
      >();

    let count = 0;

    for (const result of results) {
      const value =
        this.getMovementResultComparisonValue(
          result,
        );

      if (
        value === null
      ) {
        continue;
      }

      const repsKey =
        result
          .measurementType
          .key ===
        'WEIGHT'
          ? result.reps
          : null;

      if (
        result
          .measurementType
          .key ===
          'WEIGHT' &&
        repsKey === null
      ) {
        continue;
      }

      const trackKey =
        [
          result.movementId,
          result
            .measurementType
            .id,
          repsKey ??
            'none',
        ].join(
          ':',
        );

      const previousBest =
        bestByTrack.get(
          trackKey,
        );

      const lowerIsBetter =
        result
          .measurementType
          .key ===
        'DURATION';

      const isPersonalRecord =
        !previousBest ||
        (
          lowerIsBetter
            ? value <
              previousBest.value
            : value >
              previousBest.value
        );

      if (
        !isPersonalRecord
      ) {
        continue;
      }

      bestByTrack.set(
        trackKey,
        {
          value,
        },
      );

      if (
        result.performedAt >=
          startDate &&
        result.performedAt <
          endDate
      ) {
        count += 1;
      }
    }

    return count;
  }

  private getMovementResultComparisonValue(
    result: {
      measurementType: {
        key: string;
      };

      reps:
        | number
        | null;

      load:
        | unknown
        | null;

      weightUnit:
        | WeightUnit;

      distance:
        | number
        | null;

      durationSeconds:
        | number
        | null;

      calories:
        | number
        | null;
    },
  ) {
    switch (
      result.measurementType.key
    ) {
      case 'WEIGHT':
        if (
          result.load ===
          null
        ) {
          return null;
        }

        return this.getLoadInKg(
          result.load,
          result.weightUnit,
        );

      case 'REPS':
        return result.reps;

      case 'DISTANCE':
        return result.distance;

      case 'DURATION':
        return result.durationSeconds;

      case 'CALORIES':
        return result.calories;

      default:
        return null;
    }
  }

  private mapWorkoutResultValue(
    result: {
      resultType: {
        key: string;
      };

      timeSeconds:
        | number
        | null;

      rounds:
        | number
        | null;

      reps:
        | number
        | null;

      load:
        | unknown
        | null;

      weightUnit:
        | WeightUnit;
    },
  ) {
    switch (
      result.resultType.key
    ) {
      case 'TIME':
        return {
          type:
            'DURATION' as const,

          value:
            result.timeSeconds,
        };

      case 'ROUNDS_REPS':
        return {
          type:
            'ROUNDS_REPS' as const,

          rounds:
            result.rounds,

          reps:
            result.reps,
        };

      case 'REPS':
        return {
          type:
            'REPS' as const,

          value:
            result.reps,
        };

      case 'LOAD':
        return {
          type:
            'WEIGHT' as const,

          value:
            result.load !==
              null
              ? Number(
                  result.load,
                )
              : null,

          weightUnit:
            result.weightUnit,
        };

      default:
        return {
          type:
            'UNKNOWN' as const,
        };
    }
  }

  private mapMovementResultValue(
    result: {
      measurementType: {
        key: string;
      };

      reps:
        | number
        | null;

      load:
        | unknown
        | null;

      weightUnit:
        | WeightUnit;

      distance:
        | number
        | null;

      durationSeconds:
        | number
        | null;

      calories:
        | number
        | null;
    },
  ) {
    switch (
      result
        .measurementType
        .key
    ) {
      case 'WEIGHT':
        return {
          type:
            'WEIGHT' as const,

          reps:
            result.reps,

          value:
            result.load !==
              null
              ? Number(
                  result.load,
                )
              : null,

          weightUnit:
            result.weightUnit,
        };

      case 'REPS':
        return {
          type:
            'REPS' as const,

          value:
            result.reps,
        };

      case 'DISTANCE':
        return {
          type:
            'DISTANCE' as const,

          value:
            result.distance,
        };

      case 'DURATION':
        return {
          type:
            'DURATION' as const,

          value:
            result.durationSeconds,
        };

      case 'CALORIES':
        return {
          type:
            'CALORIES' as const,

          value:
            result.calories,
        };

      default:
        return {
          type:
            'UNKNOWN' as const,
        };
    }
  }

  private getLoadInKg(
    load: unknown,
    weightUnit:
      | WeightUnit,
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
}