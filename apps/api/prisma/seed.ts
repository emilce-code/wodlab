import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const movementCategories = [
  {
    key: 'WEIGHTLIFTING',
    name: 'Weightlifting',
    description: 'Movements involving external loads and weightlifting patterns.',
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
    description: 'Cyclical conditioning movements such as running, rowing, and biking.',
    sortOrder: 3,
  },
  {
    key: 'OTHER',
    name: 'Other',
    description: 'Movements that do not fit another category.',
    sortOrder: 4,
  },
];

const measurementTypes = [
  {
    key: 'REPS',
    name: 'Repetitions',
    description: 'Measured by number of repetitions.',
    sortOrder: 1,
  },
  {
    key: 'WEIGHT',
    name: 'Weight',
    description: 'Measured by load lifted.',
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
];

const movements = [
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
  },
  {
    name: 'Hang Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Hang Power Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Split Clean',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Clean and Jerk',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['C&J'],
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
  },
  {
    name: 'Hang Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Hang Power Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Muscle Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Split Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
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
    aliases: ['KBS'],
  },
  {
    name: 'Kettlebell Snatch',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Wall-ball Shot',
    categoryKey: 'WEIGHTLIFTING',
    measurementTypeKeys: ['WEIGHT', 'REPS'],
    isFoundational: false,
    aliases: ['Wall Ball'],
  },

  // Gymnastics
  {
    name: 'Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Strict Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Kipping Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Butterfly Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
  },
  {
    name: 'Kipping Chest-to-bar Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['C2B'],
  },
  {
    name: 'Strict Chest-to-bar Pull-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict C2B'],
  },
  {
    name: 'Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
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
    aliases: [],
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
  },
  {
    name: 'Strict Handstand Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict HSPU'],
  },
  {
    name: 'Kipping Handstand Push-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['HSPU'],
  },
  {
    name: 'Wall Walk',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: [],
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
  },
  {
    name: 'Strict Bar Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Strict BMU'],
  },
  {
    name: 'Kipping Bar Muscle-up',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['BMU'],
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
  },
  {
    name: 'Single-leg Squat (Pistol)',
    categoryKey: 'GYMNASTICS',
    measurementTypeKeys: ['REPS'],
    isFoundational: false,
    aliases: ['Pistol'],
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
  },

  // Erg
  {
    name: 'Row',
    categoryKey: 'MONOSTRUCTURAL',
    measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'],
    isFoundational: false,
    aliases: ['Rowing'],
  },
] as const;

function buildMovementSearchText(
    name: string,
    aliases: readonly string[],
  ): string {
    return [name, ...aliases].join(' ').toLowerCase();
}

async function main() {
  console.log('Starting database seed...');

  for (const category of movementCategories) {
    await prisma.movementCategory.upsert({
      where: {
        key: category.key,
      },
      update: category,
      create: category,
    });
  }

  console.log('Movement categories seeded.');

  for (const measurementType of measurementTypes) {
    await prisma.measurementType.upsert({
      where: {
        key: measurementType.key,
      },
      update: measurementType,
      create: measurementType,
    });
  }

  console.log('Measurement types seeded.');

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
      },
    });
  }

  console.log('Movements seeded.');
  console.log('Database seed completed.');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });