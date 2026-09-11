import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedBenchmarkWorkouts } from './seed/benchmarks';
import { seedMovements } from './seed/movements';
import { seedReferenceData } from './seed/reference-data';
import { validateSeedData } from './seed/validation';

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

async function main(): Promise<void> {
  console.log('🌱 Starting Wodlab database seed...');

  validateSeedData();

  await seedReferenceData(prisma);
  await seedMovements(prisma);
  await seedBenchmarkWorkouts(prisma);

  console.log('✅ Wodlab database seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Wodlab database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
