import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ScheduledWorkoutsController } from './scheduled-workouts.controller';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';

@Module({
  imports: [AuthModule],
  controllers: [ScheduledWorkoutsController],
  providers: [ScheduledWorkoutsService],
  exports: [ScheduledWorkoutsService],
})
export class ScheduledWorkoutsModule {}
