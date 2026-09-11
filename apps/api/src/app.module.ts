import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoachesModule } from './coaches/coaches.module';
import { CoachProgrammingModule } from './coach-programming/coach-programming.module';
import { BoxesModule } from './boxes/boxes.module';

import { AthleteProfilesModule } from './athlete-profiles/athlete-profiles.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MovementsModule } from './movements/movements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduledWorkoutsModule } from './scheduled-workouts/scheduled-workouts.module';
import { TrainingModule } from './training/training.module';
import { TrainingCalculatorsModule } from './training-calculators/training-calculators.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { WorkoutStrategiesModule } from './workout-strategies/workout-strategies.module';
import { WorkoutImportsModule } from './workout-imports/workout-imports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    BoxesModule,
    CoachesModule,
    CoachProgrammingModule,
    UsersModule,
    AthleteProfilesModule,
    MovementsModule,
    NotificationsModule,
    WorkoutsModule,
    WorkoutImportsModule,
    WorkoutStrategiesModule,
    ScheduledWorkoutsModule,
    TrainingModule,
    TrainingCalculatorsModule,
  ],
})
export class AppModule {}
