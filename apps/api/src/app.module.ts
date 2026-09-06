import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoachesModule } from './coaches/coaches.module';

import { AthleteProfilesModule } from './athlete-profiles/athlete-profiles.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduledWorkoutsModule } from './scheduled-workouts/scheduled-workouts.module';
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
    CoachesModule,
    UsersModule,
    AthleteProfilesModule,
    MovementsModule,
    WorkoutsModule,
    ScheduledWorkoutsModule,
    TrainingModule,
  ],
})
export class AppModule {}
