import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AthleteBalanceInsightsService } from './athlete-balance-insights.service';
import { AthleteInsightsService } from './athlete-insights.service';
import { AthletePerformanceInsightsService } from './athlete-performance-insights.service';
import { AthleteTrainingLoadService } from './athlete-training-load.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],

  controllers: [UsersController],

  providers: [
    UsersService,
    AthleteInsightsService,
    AthleteBalanceInsightsService,
    AthletePerformanceInsightsService,
    AthleteTrainingLoadService,
  ],

  exports: [UsersService],
})
export class UsersModule {}
