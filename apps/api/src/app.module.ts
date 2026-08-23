import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AthleteProfilesModule } from './athlete-profiles/athlete-profiles.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { TrainingModule } from './training/training.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AthleteProfilesModule,
    MovementsModule,
    WorkoutsModule,
    TrainingModule,
  ],
})
export class AppModule {}