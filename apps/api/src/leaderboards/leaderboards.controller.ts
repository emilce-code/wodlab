import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FindWorkoutLeaderboardQueryDto } from './dto/find-workout-leaderboard-query.dto';
import { LeaderboardsService } from './leaderboards.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('leaderboards')
@UseGuards(JwtAuthGuard)
export class LeaderboardsController {
  constructor(private readonly leaderboards: LeaderboardsService) {}

  @Get('workouts/:workoutId')
  findWorkoutLeaderboard(
    @Req() request: AuthenticatedRequest,
    @Param('workoutId') workoutId: string,
    @Query() query: FindWorkoutLeaderboardQueryDto,
  ) {
    return this.leaderboards.findWorkoutLeaderboard(
      request.user.userId,
      workoutId,
      query,
    );
  }
}
