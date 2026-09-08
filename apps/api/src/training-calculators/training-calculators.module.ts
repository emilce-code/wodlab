import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TrainingCalculatorsController } from './training-calculators.controller';
import { TrainingCalculatorsService } from './training-calculators.service';

@Module({
  imports: [AuthModule],
  controllers: [TrainingCalculatorsController],
  providers: [TrainingCalculatorsService],
})
export class TrainingCalculatorsModule {}
