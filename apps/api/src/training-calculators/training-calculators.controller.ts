import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrainingCalculatorsService } from './training-calculators.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('training-calculators')
@UseGuards(JwtAuthGuard)
export class TrainingCalculatorsController {
  constructor(private readonly service: TrainingCalculatorsService) {}

  @Get('workouts/:workoutId/targets')
  getWorkoutTargets(
    @Req() request: AuthenticatedRequest,
    @Param('workoutId') workoutId: string,
  ) {
    return this.service.getWorkoutTargets(request.user.userId, workoutId);
  }
}
