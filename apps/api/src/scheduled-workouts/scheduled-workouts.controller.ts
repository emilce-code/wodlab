import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateScheduledWorkoutDto } from './dto/create-scheduled-workout.dto';
import { FindScheduledWorkoutsQueryDto } from './dto/find-scheduled-workouts-query.dto';
import { UpdateScheduledWorkoutDto } from './dto/update-scheduled-workout.dto';
import { UpdateAthleteCommentDto } from './dto/update-athlete-comment.dto';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('scheduled-workouts')
@UseGuards(JwtAuthGuard)
export class ScheduledWorkoutsController {
  constructor(
    private readonly scheduledWorkoutsService: ScheduledWorkoutsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateScheduledWorkoutDto,
  ) {
    return this.scheduledWorkoutsService.create(request.user.userId, dto);
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindScheduledWorkoutsQueryDto,
  ) {
    return this.scheduledWorkoutsService.findAll(request.user.userId, query);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateScheduledWorkoutDto,
  ) {
    return this.scheduledWorkoutsService.update(request.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.scheduledWorkoutsService.remove(request.user.userId, id);
  }

  @Patch(':id/comment')
  updateComment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAthleteCommentDto,
  ) {
    return this.scheduledWorkoutsService.updateAthleteComment(
      request.user.userId,
      id,
      dto,
    );
  }
}
