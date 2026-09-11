import type { PrismaClient } from '../../generated/prisma/client';
import { buildMovementSearchText } from './helpers';

export type MovementSeed = {
  name: string;
  categoryKey:
    | 'WEIGHTLIFTING'
    | 'GYMNASTICS'
    | 'MONOSTRUCTURAL'
    | 'OTHER';
  measurementTypeKeys: readonly (
    | 'REPS'
    | 'WEIGHT'
    | 'DISTANCE'
    | 'DURATION'
    | 'CALORIES'
  )[];
  isFoundational: boolean;
  aliases: readonly string[];
  baseMovementName?: string;
  description?: string;
};

export const movements: readonly MovementSeed[] = [
  // Squats
  {
    name: 'Air Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['REPS'],
    isFoundational: true,
    aliases: [],
  },
  {
    name: 'Back Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Front Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: [],
  },
  {
    name: 'Overhead Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: ['OHS'],
  },
  {
    name: 'Zercher Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Goblet Squat',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },

  // Presses / Jerks
  {
    name: 'Shoulder Press',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: ['Strict Press'],
  },
  {
    name: 'Push Press',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: [],
  },
  {
    name: 'Push Jerk',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: [],
  },
  {
    name: 'Split Jerk',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Push Jerk',
  },

  // Deadlifts
  {
    name: 'Deadlift',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: ['DL'],
  },
  {
    name: 'Sumo Deadlift',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Deadlift',
  },
  {
    name: 'Sumo Deadlift High Pull',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: ['SDHP'],
  },

  // Cleans
  {
    name: 'Medicine-Ball Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: true,
    aliases: ['Med-Ball Clean'],
  },
  {
    name: 'Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Power Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Clean',
  },
  {
    name: 'Hang Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Clean',
  },
  {
    name: 'Hang Power Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Clean',
  },
  {
    name: 'Split Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Clean',
  },
  {
    name: 'Clean and Jerk',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['C&J', 'Clean & Jerk'],
  },

  // Snatches
  {
    name: 'Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Power Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Snatch',
  },
  {
    name: 'Hang Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Snatch',
  },
  {
    name: 'Hang Power Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Snatch',
  },
  {
    name: 'Muscle Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Snatch',
  },
  {
    name: 'Split Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Snatch',
  },
  {
    name: 'Snatch Balance',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },

  // Other loaded movements
  {
    name: 'Thruster',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Kettlebell Swing',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['KBS', 'American Kettlebell Swing'],
  },
  {
    name: 'Kettlebell Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['KB Snatch'],
  },
  {
    name: 'Wall-ball Shot',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['Wall Ball', 'Wall-ball'],
  },
  {
    name: 'Dumbbell Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['DB Snatch'],
  },
  {
    name: 'Dumbbell Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['DB Clean'],
  },
  {
    name: 'Dumbbell Clean and Jerk',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['DB Clean and Jerk', 'DB C&J'],
  },
  {
    name: 'Dumbbell Thruster',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['DB Thruster'],
  },
  {
    name: 'Dumbbell Front Rack Lunge',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS', 'DISTANCE'],
    isFoundational: false,
    aliases: ['DB Front Rack Lunge'],
  },
  {
    name: 'Farmers Carry',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'],
    isFoundational: false,
    aliases: ['Farmer Carry', 'Farmers Walk'],
  },
  {
    name: 'Front Rack Carry',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Overhead Carry',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'],
    isFoundational: false,
    aliases: [],
  },

  // Gymnastics
  {
    name: 'Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Pull Up'],
  },
  {
    name: 'Strict Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Pull-up',
  },
  {
    name: 'Kipping Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Pull-up',
  },
  {
    name: 'Butterfly Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Pull-up',
  },
  {
    name: 'Kipping Chest-to-bar Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['C2B'],
    baseMovementName: 'Pull-up',
  },
  {
    name: 'Strict Chest-to-bar Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict C2B'],
    baseMovementName: 'Pull-up',
  },
  {
    name: 'Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: true,
    aliases: ['Push Up'],
  },
  {
    name: 'Burpee',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Burpee Box Jump-over',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['BBJO'],
    baseMovementName: 'Burpee',
  },
  {
    name: 'Box Jump',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Box Step-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Box Step Up'],
  },
  {
    name: 'Handstand',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['DURATION'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Handstand Walk',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['DISTANCE', 'DURATION'],
    isFoundational: false,
    aliases: ['HSW'],
    baseMovementName: 'Handstand',
  },
  {
    name: 'Strict Handstand Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict HSPU'],
    baseMovementName: 'Handstand',
  },
  {
    name: 'Kipping Handstand Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['HSPU'],
    baseMovementName: 'Handstand',
  },
  {
    name: 'Wall Walk',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Handstand',
  },
  {
    name: 'Dip',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Ring Dip',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Dip',
  },
  {
    name: 'Strict Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Kipping Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Strict Muscle-up',
  },
  {
    name: 'Strict Bar Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict BMU'],
    baseMovementName: 'Strict Muscle-up',
  },
  {
    name: 'Kipping Bar Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['BMU'],
    baseMovementName: 'Strict Muscle-up',
  },
  {
    name: 'Strict Toes-to-bar',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict TTB'],
  },
  {
    name: 'Kipping Toes-to-bar',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['TTB'],
    baseMovementName: 'Strict Toes-to-bar',
  },
  {
    name: 'Single-leg Squat (Pistol)',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Pistol', 'Pistol Squat'],
  },
  {
    name: 'Rope Climb (Wrapping)',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Rope Climb'],
  },
  {
    name: 'Legless Rope Climb',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
    baseMovementName: 'Rope Climb (Wrapping)',
  },
  {
    name: 'Sit-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: true,
    aliases: ['Sit Up'],
  },
  {
    name: 'GHD Sit-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['GHD', 'GHD Sit Up'],
    baseMovementName: 'Sit-up',
  },
  {
    name: 'V-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['V Up'],
    baseMovementName: 'Sit-up',
  },
  {
    name: 'Lunge',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS', 'DISTANCE'],
    isFoundational: true,
    aliases: ['Walking Lunge'],
  },
  {
    name: 'Bear Crawl',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['DISTANCE', 'DURATION'],
    isFoundational: false,
    aliases: [],
  },

  // Jump rope
  {
    name: 'Single-under',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Single Under', 'SU'],
  },
  {
    name: 'Double-under',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Double Under', 'DU'],
    baseMovementName: 'Single-under',
  },

  // Running / ergs
  {
    name: 'Run',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'DURATION'],
    isFoundational: true,
    aliases: ['Running'],
  },
  {
    name: 'Shuttle Run',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'REPS', 'DURATION'],
    isFoundational: false,
    aliases: ['Shuttle'],
    baseMovementName: 'Run',
  },
  {
    name: 'Row',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'],
    isFoundational: false,
    aliases: ['Rowing', 'Rower'],
  },
  {
    name: 'Ski Erg',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'],
    isFoundational: false,
    aliases: ['Ski', 'SkiErg'],
  },
  {
    name: 'Bike Erg',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'],
    isFoundational: false,
    aliases: ['BikeErg'],
  },
  {
    name: 'Air Bike',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['CALORIES', 'DURATION'],
    isFoundational: false,
    aliases: ['Assault Bike', 'Echo Bike', 'Bike'],
  },
];

export async function seedMovements(prisma: PrismaClient): Promise<void> {
  console.log('  • Seeding movements...');

  for (const movement of movements) {
    await prisma.movement.upsert({
      where: {
        name: movement.name,
      },
      update: {
        category: {
          connect: {
            key: movement.categoryKey,
          },
        },
        measurementTypes: {
          deleteMany: {},
          create: movement.measurementTypeKeys.map((key) => ({
            measurementType: {
              connect: { key },
            },
          })),
        },
        isFoundational: movement.isFoundational,
        official: true,
        aliases: [...movement.aliases],
        searchText: buildMovementSearchText(
          movement.name,
          movement.aliases,
        ),
        description: movement.description ?? null,
      },
      create: {
        name: movement.name,
        category: {
          connect: {
            key: movement.categoryKey,
          },
        },
        measurementTypes: {
          create: movement.measurementTypeKeys.map((key) => ({
            measurementType: {
              connect: { key },
            },
          })),
        },
        isFoundational: movement.isFoundational,
        official: true,
        aliases: [...movement.aliases],
        searchText: buildMovementSearchText(
          movement.name,
          movement.aliases,
        ),
        description: movement.description,
      },
    });
  }

  const idsByName = new Map(
    (
      await prisma.movement.findMany({
        where: {
          name: {
            in: movements.map((movement) => movement.name),
          },
        },
        select: {
          id: true,
          name: true,
        },
      })
    ).map((movement) => [movement.name, movement.id]),
  );

  for (const movement of movements) {
    const movementId = idsByName.get(movement.name);

    if (!movementId) {
      throw new Error(
        `Movement "${movement.name}" was not found after seeding.`,
      );
    }

    const baseMovementId = movement.baseMovementName
      ? idsByName.get(movement.baseMovementName)
      : null;

    if (movement.baseMovementName && !baseMovementId) {
      throw new Error(
        `Base movement "${movement.baseMovementName}" for "${movement.name}" was not found.`,
      );
    }

    await prisma.movement.update({
      where: {
        id: movementId,
      },
      data: {
        baseMovementId,
      },
    });
  }

  console.log(`    ✓ ${movements.length} movements seeded`);
}
