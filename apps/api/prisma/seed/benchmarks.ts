import type {
  Prisma,
  PrismaClient,
  WeightUnit,
} from '../../generated/prisma/client';
import { requireValue } from './helpers';

type PrescriptionSeed = {
  MEN?: {
    weight?: number;
    reps?: number;
    distance?: number;
    calories?: number;
    durationSeconds?: number;
    notes?: string;
  };
  WOMEN?: {
    weight?: number;
    reps?: number;
    distance?: number;
    calories?: number;
    durationSeconds?: number;
    notes?: string;
  };
};

type BenchmarkMovementSeed = {
  movementName: string;
  order: number;
  reps?: number;
  weight?: number;
  weightUnit?: WeightUnit;
  distance?: number;
  calories?: number;
  durationSeconds?: number;
  notes?: string;
  prescriptions?: PrescriptionSeed;
};

type BenchmarkSectionSeed = {
  order: number;
  typeKey: string;
  rounds?: number;
  durationSeconds?: number;
  restSeconds?: number;
  repScheme?: number[];
  notes?: string;
  movements: BenchmarkMovementSeed[];
};

type BenchmarkVariantSeed = {
  levelKey: 'RX' | 'INTERMEDIATE' | 'BEGINNER';
  name?: string;
  notes?: string;
  sections: BenchmarkSectionSeed[];
};

type BenchmarkWorkoutSeed = {
  name: string;
  description: string;
  typeKey: string;
  variants: BenchmarkVariantSeed[];
};

const KG = 'KG' as WeightUnit;

const benchmarks: BenchmarkWorkoutSeed[] = [
  {
    name: 'Fran',
    description:
      'Classic 21-15-9 couplet of thrusters and pull-ups performed for time.',
    typeKey: 'FOR_TIME',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [21, 15, 9],
            movements: [
              {
                movementName: 'Thruster',
                order: 1,
                prescriptions: {
                  MEN: { weight: 43 },
                  WOMEN: { weight: 29 },
                },
              },
              {
                movementName: 'Pull-up',
                order: 2,
              },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        notes: 'Moderate load and volume-preserving pull-up scaling.',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [21, 15, 9],
            movements: [
              {
                movementName: 'Thruster',
                order: 1,
                prescriptions: {
                  MEN: { weight: 34 },
                  WOMEN: { weight: 25 },
                },
              },
              {
                movementName: 'Kipping Pull-up',
                order: 2,
                notes: 'Scale to banded pull-ups if needed.',
              },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        notes: 'Reduced load with strict bodyweight pulling progression.',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [15, 12, 9],
            movements: [
              {
                movementName: 'Thruster',
                order: 1,
                prescriptions: {
                  MEN: { weight: 20 },
                  WOMEN: { weight: 15 },
                },
              },
              {
                movementName: 'Strict Pull-up',
                order: 2,
                notes: 'Use band assistance as needed.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Grace',
    description: '30 clean and jerks for time.',
    typeKey: 'FOR_TIME',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Clean and Jerk',
                order: 1,
                reps: 30,
                prescriptions: {
                  MEN: { weight: 61 },
                  WOMEN: { weight: 43 },
                },
              },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Clean and Jerk',
                order: 1,
                reps: 30,
                prescriptions: {
                  MEN: { weight: 43 },
                  WOMEN: { weight: 29 },
                },
              },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Clean and Jerk',
                order: 1,
                reps: 20,
                prescriptions: {
                  MEN: { weight: 29 },
                  WOMEN: { weight: 20 },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Isabel',
    description: '30 snatches for time.',
    typeKey: 'FOR_TIME',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Snatch',
                order: 1,
                reps: 30,
                prescriptions: {
                  MEN: { weight: 61 },
                  WOMEN: { weight: 43 },
                },
              },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Power Snatch',
                order: 1,
                reps: 30,
                prescriptions: {
                  MEN: { weight: 43 },
                  WOMEN: { weight: 29 },
                },
              },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            movements: [
              {
                movementName: 'Power Snatch',
                order: 1,
                reps: 20,
                prescriptions: {
                  MEN: { weight: 29 },
                  WOMEN: { weight: 20 },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Cindy',
    description:
      '20-minute AMRAP of 5 pull-ups, 10 push-ups, and 15 air squats.',
    typeKey: 'AMRAP',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'AMRAP',
            durationSeconds: 20 * 60,
            movements: [
              { movementName: 'Pull-up', order: 1, reps: 5 },
              { movementName: 'Push-up', order: 2, reps: 10 },
              { movementName: 'Air Squat', order: 3, reps: 15 },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        sections: [
          {
            order: 1,
            typeKey: 'AMRAP',
            durationSeconds: 20 * 60,
            movements: [
              {
                movementName: 'Kipping Pull-up',
                order: 1,
                reps: 5,
                notes: 'Use band assistance if needed.',
              },
              { movementName: 'Push-up', order: 2, reps: 10 },
              { movementName: 'Air Squat', order: 3, reps: 15 },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        sections: [
          {
            order: 1,
            typeKey: 'AMRAP',
            durationSeconds: 12 * 60,
            movements: [
              {
                movementName: 'Strict Pull-up',
                order: 1,
                reps: 3,
                notes: 'Use band assistance.',
              },
              {
                movementName: 'Push-up',
                order: 2,
                reps: 6,
                notes: 'Elevate hands as needed.',
              },
              { movementName: 'Air Squat', order: 3, reps: 9 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Annie',
    description:
      '50-40-30-20-10 repetitions of double-unders and sit-ups for time.',
    typeKey: 'FOR_TIME',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [50, 40, 30, 20, 10],
            movements: [
              { movementName: 'Double-under', order: 1 },
              { movementName: 'Sit-up', order: 2 },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [40, 30, 20, 10],
            movements: [
              {
                movementName: 'Double-under',
                order: 1,
                notes: 'Attempts count. Scale to 2x single-unders if needed.',
              },
              { movementName: 'Sit-up', order: 2 },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            repScheme: [50, 40, 30, 20, 10],
            movements: [
              { movementName: 'Single-under', order: 1 },
              { movementName: 'Sit-up', order: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Helen',
    description:
      '3 rounds for time of a 400 m run, 21 kettlebell swings, and 12 pull-ups.',
    typeKey: 'FOR_TIME',
    variants: [
      {
        levelKey: 'RX',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            rounds: 3,
            movements: [
              { movementName: 'Run', order: 1, distance: 400 },
              {
                movementName: 'Kettlebell Swing',
                order: 2,
                reps: 21,
                prescriptions: {
                  MEN: { weight: 24 },
                  WOMEN: { weight: 16 },
                },
              },
              { movementName: 'Pull-up', order: 3, reps: 12 },
            ],
          },
        ],
      },
      {
        levelKey: 'INTERMEDIATE',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            rounds: 3,
            movements: [
              { movementName: 'Run', order: 1, distance: 400 },
              {
                movementName: 'Kettlebell Swing',
                order: 2,
                reps: 21,
                prescriptions: {
                  MEN: { weight: 20 },
                  WOMEN: { weight: 12 },
                },
              },
              {
                movementName: 'Kipping Pull-up',
                order: 3,
                reps: 10,
                notes: 'Band assistance allowed.',
              },
            ],
          },
        ],
      },
      {
        levelKey: 'BEGINNER',
        sections: [
          {
            order: 1,
            typeKey: 'FOR_TIME',
            rounds: 3,
            movements: [
              { movementName: 'Run', order: 1, distance: 200 },
              {
                movementName: 'Kettlebell Swing',
                order: 2,
                reps: 15,
                prescriptions: {
                  MEN: { weight: 12 },
                  WOMEN: { weight: 8 },
                },
              },
              {
                movementName: 'Strict Pull-up',
                order: 3,
                reps: 6,
                notes: 'Use band assistance.',
              },
            ],
          },
        ],
      },
    ],
  },
];

async function ensureSeedUser(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: {
      auth0UserId: 'seed|wodlab-system',
    },
    update: {
      email: 'seed@wodlab.local',
      role: 'ADMIN',
    },
    create: {
      auth0UserId: 'seed|wodlab-system',
      email: 'seed@wodlab.local',
      role: 'ADMIN',
    },
  });
}

function prescriptionData(
  data: NonNullable<PrescriptionSeed['MEN']>,
): Omit<
  Prisma.WorkoutMovementPrescriptionUncheckedCreateWithoutWorkoutMovementInput,
  'prescriptionCategoryId'
> {
  return {
    reps: data.reps,
    weight: data.weight,
    weightUnit: data.weight !== undefined ? KG : undefined,
    distance: data.distance,
    calories: data.calories,
    durationSeconds: data.durationSeconds,
    notes: data.notes,
  };
}

export async function seedBenchmarkWorkouts(
  prisma: PrismaClient,
): Promise<void> {
  console.log('  • Seeding benchmark workouts...');

  const seedUser = await ensureSeedUser(prisma);

  for (const benchmark of benchmarks) {
    const type = requireValue(
      await prisma.workoutType.findUnique({
        where: {
          key: benchmark.typeKey,
        },
      }),
      `Workout type "${benchmark.typeKey}" was not found.`,
    );

    const existingWorkout = await prisma.workout.findFirst({
      where: {
        name: benchmark.name,
        official: true,
        isBenchmark: true,
      },
    });

    const workout = existingWorkout
      ? await prisma.workout.update({
          where: {
            id: existingWorkout.id,
          },
          data: {
            description: benchmark.description,
            typeId: type.id,
            official: true,
            isBenchmark: true,
            isActive: true,
            deactivatedAt: null,
          },
        })
      : await prisma.workout.create({
          data: {
            name: benchmark.name,
            description: benchmark.description,
            typeId: type.id,
            createdByUserId: seedUser.id,
            official: true,
            isBenchmark: true,
          },
        });

    for (const variantSeed of benchmark.variants) {
      const level = requireValue(
        await prisma.workoutLevel.findUnique({
          where: {
            key: variantSeed.levelKey,
          },
        }),
        `Workout level "${variantSeed.levelKey}" was not found.`,
      );

      const variant = await prisma.workoutVariant.upsert({
        where: {
          workoutId_levelId: {
            workoutId: workout.id,
            levelId: level.id,
          },
        },
        update: {
          name: variantSeed.name,
          notes: variantSeed.notes,
        },
        create: {
          workoutId: workout.id,
          levelId: level.id,
          name: variantSeed.name,
          notes: variantSeed.notes,
        },
      });

      for (const sectionSeed of variantSeed.sections) {
        const sectionType = requireValue(
          await prisma.workoutType.findUnique({
            where: {
              key: sectionSeed.typeKey,
            },
          }),
          `Workout section type "${sectionSeed.typeKey}" was not found.`,
        );

        const section = await prisma.workoutSection.upsert({
          where: {
            variantId_order: {
              variantId: variant.id,
              order: sectionSeed.order,
            },
          },
          update: {
            typeId: sectionType.id,
            rounds: sectionSeed.rounds,
            durationSeconds: sectionSeed.durationSeconds,
            restSeconds: sectionSeed.restSeconds,
            notes: sectionSeed.notes,
            repScheme: sectionSeed.repScheme ?? [],
          },
          create: {
            variantId: variant.id,
            typeId: sectionType.id,
            order: sectionSeed.order,
            rounds: sectionSeed.rounds,
            durationSeconds: sectionSeed.durationSeconds,
            restSeconds: sectionSeed.restSeconds,
            notes: sectionSeed.notes,
            repScheme: sectionSeed.repScheme ?? [],
          },
        });

        for (const movementSeed of sectionSeed.movements) {
          const movement = requireValue(
            await prisma.movement.findUnique({
              where: {
                name: movementSeed.movementName,
              },
            }),
            `Movement "${movementSeed.movementName}" was not found while seeding "${benchmark.name}".`,
          );

          const workoutMovement = await prisma.workoutMovement.upsert({
            where: {
              sectionId_order: {
                sectionId: section.id,
                order: movementSeed.order,
              },
            },
            update: {
              movementId: movement.id,
              reps: movementSeed.reps,
              weight: movementSeed.weight,
              weightUnit: movementSeed.weightUnit,
              distance: movementSeed.distance,
              calories: movementSeed.calories,
              durationSeconds: movementSeed.durationSeconds,
              notes: movementSeed.notes,
            },
            create: {
              sectionId: section.id,
              movementId: movement.id,
              order: movementSeed.order,
              reps: movementSeed.reps,
              weight: movementSeed.weight,
              weightUnit: movementSeed.weightUnit,
              distance: movementSeed.distance,
              calories: movementSeed.calories,
              durationSeconds: movementSeed.durationSeconds,
              notes: movementSeed.notes,
            },
          });

          for (const [categoryKey, data] of Object.entries(
            movementSeed.prescriptions ?? {},
          )) {
            if (!data) {
              continue;
            }

            const category = requireValue(
              await prisma.prescriptionCategory.findUnique({
                where: {
                  key: categoryKey,
                },
              }),
              `Prescription category "${categoryKey}" was not found.`,
            );

            await prisma.workoutMovementPrescription.upsert({
              where: {
                workoutMovementId_prescriptionCategoryId: {
                  workoutMovementId: workoutMovement.id,
                  prescriptionCategoryId: category.id,
                },
              },
              update: prescriptionData(data),
              create: {
                workoutMovementId: workoutMovement.id,
                prescriptionCategoryId: category.id,
                ...prescriptionData(data),
              },
            });
          }
        }
      }
    }
  }

  console.log(`    ✓ ${benchmarks.length} benchmark workouts seeded`);
}
