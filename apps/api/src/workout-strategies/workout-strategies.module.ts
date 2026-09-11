import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkoutStrategiesController } from './workout-strategies.controller';
import { WorkoutStrategiesService } from './workout-strategies.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkoutStrategiesController],
  providers: [WorkoutStrategiesService],
})
export class WorkoutStrategiesModule {}
