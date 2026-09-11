import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WorkoutImportsController } from './workout-imports.controller';
import { WorkoutImportsService } from './workout-imports.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutImportsController],
  providers: [WorkoutImportsService],
})
export class WorkoutImportsModule {}
