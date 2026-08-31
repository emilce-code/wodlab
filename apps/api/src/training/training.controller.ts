import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrainingService } from './training.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('history')
  findHistory(@Req() request: AuthenticatedRequest) {
    return this.trainingService.findHistory(request.user.userId);
  }
}
