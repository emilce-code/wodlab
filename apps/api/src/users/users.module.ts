import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AthleteInsightsService } from './athlete-insights.service';
import { AthletePerformanceInsightsService } from './athlete-performance-insights.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],

  controllers: [UsersController],

  providers: [
    UsersService,
    AthleteInsightsService,
    AthletePerformanceInsightsService,
  ],

  exports: [UsersService],
})
export class UsersModule {}
