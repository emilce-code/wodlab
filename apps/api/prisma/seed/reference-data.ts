import type { PrismaClient } from '../../generated/prisma/client';
import { requireId } from './helpers';

export const movementCategories = [
  {
    key: 'WEIGHTLIFTING',
    name: 'Weightlifting',
    description:
      'Movements involving external loads, weightlifting patterns, carries, and loaded functional movements.',
    sortOrder: 1,
  },
  {
    key: 'GYMNASTICS',
    name: 'Gymnastics',
    description: 'Bodyweight and gymnastics-based movements.',
    sortOrder: 2,
  },
  {
    key: 'MONOSTRUCTURAL',
    name: 'Monostructural',
    description:
      'Cyclical conditioning movements such as running, rowing, skiing, biking, and jump rope.',
    sortOrder: 3,
  },
  {
    key: 'OTHER',
    name: 'Other',
    description: 'Movements that do not fit another category.',
    sortOrder: 4,
  },
] as const;

export const measurementTypes = [
  {
    key: 'REPS',
    name: 'Repetitions',
    description: 'Measured by number of repetitions.',
    sortOrder: 1,
  },
  {
    key: 'WEIGHT',
    name: 'Weight',
    description: 'Measured by load lifted or carried.',
    sortOrder: 2,
  },
  {
    key: 'DISTANCE',
    name: 'Distance',
    description: 'Measured by distance traveled.',
    sortOrder: 3,
  },
  {
    key: 'DURATION',
    name: 'Duration',
    description: 'Measured by elapsed time.',
    sortOrder: 4,
  },
  {
    key: 'CALORIES',
    name: 'Calories',
    description: 'Measured by calories.',
    sortOrder: 5,
  },
] as const;

export const workoutTypes = [
  {
    key: 'FOR_TIME',
    name: 'For Time',
    description: 'Complete the prescribed work as quickly as possible.',
    sortOrder: 1,
  },
  {
    key: 'AMRAP',
    name: 'AMRAP',
    description:
      'Complete as many rounds or repetitions as possible within a time limit.',
    sortOrder: 2,
  },
  {
    key: 'EMOM',
    name: 'EMOM',
    description: 'Perform prescribed work at the start of each minute.',
    sortOrder: 3,
  },
  {
    key: 'STRENGTH',
    name: 'Strength',
    description:
      'Strength-focused work organized around sets, repetitions, and load.',
    sortOrder: 4,
  },
  {
    key: 'INTERVAL',
    name: 'Interval',
    description: 'Repeated work and recovery periods.',
    sortOrder: 5,
  },
  {
    key: 'MAX_REPS',
    name: 'Max Reps',
    description: 'Perform the maximum number of repetitions.',
    sortOrder: 6,
  },
  {
    key: 'CUSTOM',
    name: 'Custom',
    description:
      'A workout that does not fit another standard workout format.',
    sortOrder: 7,
  },
] as const;

export const resultTypes = [
  {
    key: 'TIME',
    name: 'Time',
    description: 'Result measured by elapsed completion time.',
    sortOrder: 1,
  },
  {
    key: 'ROUNDS_REPS',
    name: 'Rounds + Reps',
    description:
      'Result measured by completed rounds and additional repetitions.',
    sortOrder: 2,
  },
  {
    key: 'LOAD',
    name: 'Load',
    description: 'Result measured by weight lifted.',
    sortOrder: 3,
  },
  {
    key: 'REPS',
    name: 'Repetitions',
    description: 'Result measured by total repetitions completed.',
    sortOrder: 4,
  },
] as const;

export const workoutLevels = [
  {
    key: 'RX',
    name: 'RX',
    description: 'Prescribed workout as written.',
    sortOrder: 10,
  },
  {
    key: 'INTERMEDIATE',
    name: 'Intermediate',
    description:
      'A moderately scaled version that preserves the intended workout stimulus.',
    sortOrder: 20,
  },
  {
    key: 'BEGINNER',
    name: 'Beginner',
    description:
      'An accessible version for athletes developing strength, skill, or capacity.',
    sortOrder: 30,
  },
] as const;

export const prescriptionCategories = [
  {
    key: 'MEN',
    name: 'Men',
    description: 'Men prescribed values.',
    sortOrder: 10,
  },
  {
    key: 'WOMEN',
    name: 'Women',
    description: 'Women prescribed values.',
    sortOrder: 20,
  },
] as const;

const workoutTypeResultTypeMap = {
  FOR_TIME: 'TIME',
  AMRAP: 'ROUNDS_REPS',
  STRENGTH: 'LOAD',
  MAX_REPS: 'REPS',
} as const;

export async function seedReferenceData(
  prisma: PrismaClient,
): Promise<void> {
  console.log('  • Seeding reference data...');

  for (const category of movementCategories) {
    await prisma.movementCategory.upsert({
      where: { key: category.key },
      update: category,
      create: category,
    });
  }

  for (const measurementType of measurementTypes) {
    await prisma.measurementType.upsert({
      where: { key: measurementType.key },
      update: measurementType,
      create: measurementType,
    });
  }

  for (const resultType of resultTypes) {
    await prisma.resultType.upsert({
      where: { key: resultType.key },
      update: resultType,
      create: resultType,
    });
  }

  for (const workoutType of workoutTypes) {
    await prisma.workoutType.upsert({
      where: { key: workoutType.key },
      update: workoutType,
      create: workoutType,
    });
  }

  for (const level of workoutLevels) {
    await prisma.workoutLevel.upsert({
      where: { key: level.key },
      update: level,
      create: level,
    });
  }

  for (const category of prescriptionCategories) {
    await prisma.prescriptionCategory.upsert({
      where: { key: category.key },
      update: category,
      create: category,
    });
  }

  const resultTypesByKey = new Map(
    (
      await prisma.resultType.findMany({
        select: {
          id: true,
          key: true,
        },
      })
    ).map((resultType) => [resultType.key, resultType.id]),
  );

  for (const [workoutTypeKey, resultTypeKey] of Object.entries(
    workoutTypeResultTypeMap,
  )) {
    await prisma.workoutType.update({
      where: {
        key: workoutTypeKey,
      },
      data: {
        defaultResultTypeId: requireId(
          resultTypesByKey,
          resultTypeKey,
          'Result type',
        ),
      },
    });
  }

  console.log('    ✓ Reference data seeded');
}
