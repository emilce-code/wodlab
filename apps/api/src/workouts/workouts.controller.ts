import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResultDto } from './dto/create-workout-result.dto';
import { UpdateWorkoutResultDto } from './dto/update-workout-result.dto';
import { WorkoutsService } from './workouts.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(
    private readonly workoutsService: WorkoutsService,
  ) {}

  // Static routes FIRST
  @Get('types')
  findWorkoutTypes() {
    return this.workoutsService.findWorkoutTypes();
  }

  @Get('result-types')
  findResultTypes() {
    return this.workoutsService.findResultTypes();
  }

  @Get('results/history')
  findResultHistory(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workoutsService.findResultHistory(
      request.user.userId,
    );
  }

  @Get('results/progress')
  findResultProgress(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workoutsService.findResultProgress(
      request.user.userId,
    );
  }

  @Get('levels')
  findWorkoutLevels() {
    return this.workoutsService.findWorkoutLevels();
  }

  @Get('prescription-categories')
  findPrescriptionCategories() {
    return this.workoutsService.findPrescriptionCategories();
  }

  // Collection routes
  @Get()
  findAll() {
    return this.workoutsService.findAll();
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateWorkoutDto,
  ) {
    return this.workoutsService.create(
      request.user.userId,
      dto,
    );
  }

  // Workout result routes
  @Post(':id/results')
  createResult(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateWorkoutResultDto,
  ) {
    return this.workoutsService.createResult(
      request.user.userId,
      id,
      dto,
    );
  }

  @Patch(':id/results/:resultId')
  updateResult(
    @Param('id') workoutId: string,
    @Param('resultId') resultId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateWorkoutResultDto,
  ) {
    return this.workoutsService.updateResult(
      request.user.userId,
      workoutId,
      resultId,
      dto,
    );
  }

  @Delete(':id/results/:resultId')
  deleteResult(
    @Param('id') workoutId: string,
    @Param('resultId') resultId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workoutsService.deleteResult(
      request.user.userId,
      workoutId,
      resultId,
    );
  }

  @Get(':id/results/summary')
  findResultSummary(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workoutsService.findResultSummary(
      request.user.userId,
      id,
    );
  }

  @Get(':id/results')
  findResults(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workoutsService.findResults(
      request.user.userId,
      id,
    );
  }

  // Dynamic route LAST
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.workoutsService.findOne(id);
  }
}