import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedBenchmarkWorkouts } from './seed/benchmarks';
import { seedLocalDemoData } from './seed/demo-data';
import { seedMovements } from './seed/movements';
import { seedReferenceData } from './seed/reference-data';
import { validateSeedData } from './seed/validation';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('The local demo seed cannot run with NODE_ENV=production.');
}

const databaseHostname = new URL(connectionString).hostname;
const localDatabaseHosts = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'postgres',
]);

if (!localDatabaseHosts.has(databaseHostname)) {
  throw new Error(
    `The local demo seed only accepts a local database host; received "${databaseHostname}".`,
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main(): Promise<void> {
  console.log('🎭 Starting Wodlab local demo seed...');

  validateSeedData();
  await seedReferenceData(prisma);
  await seedMovements(prisma);
  await seedBenchmarkWorkouts(prisma);
  await seedLocalDemoData(prisma);

  console.log('✅ Wodlab local demo seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Wodlab local demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
