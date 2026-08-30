import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WorkoutResultsService } from './workout-results.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutResultsService],
  exports: [WorkoutsService, WorkoutResultsService],
})
export class WorkoutsModule {}
