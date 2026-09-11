import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FindWorkoutStrategyQueryDto } from './dto/find-workout-strategy-query.dto';
import { WorkoutStrategiesService } from './workout-strategies.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('workout-strategies')
@UseGuards(JwtAuthGuard)
export class WorkoutStrategiesController {
  constructor(private readonly strategies: WorkoutStrategiesService) {}

  @Get(':workoutId')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('workoutId') workoutId: string,
    @Query() query: FindWorkoutStrategyQueryDto,
  ) {
    return this.strategies.findOne(
      request.user.userId,
      workoutId,
      query.variantId,
    );
  }
}
