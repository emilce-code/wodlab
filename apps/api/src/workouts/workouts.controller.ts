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

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResultDto } from './dto/create-workout-result.dto';
import { UpdateWorkoutResultDto } from './dto/update-workout-result.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutResultsService } from './workout-results.service';
import { WorkoutsService } from './workouts.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(
    private readonly workoutsService: WorkoutsService,
    private readonly workoutResultsService: WorkoutResultsService,
  ) {}

  // Static routes FIRST
  @Get('types')
  findWorkoutTypes() {
    return this.workoutsService.findWorkoutTypes();
  }

  @Get('result-types')
  findResultTypes() {
    return this.workoutResultsService.findResultTypes();
  }

  @Get('results/history')
  findResultHistory(@Req() request: AuthenticatedRequest) {
    return this.workoutResultsService.findResultHistory(request.user.userId);
  }

  @Get('results/progress')
  findResultProgress(@Req() request: AuthenticatedRequest) {
    return this.workoutResultsService.findResultProgress(request.user.userId);
  }

  @Get('levels')
  findWorkoutLevels() {
    return this.workoutsService.findWorkoutLevels();
  }

  @Get('prescription-categories')
  findPrescriptionCategories() {
    return this.workoutsService.findPrescriptionCategories();
  }

  @Get('archived')
  findArchived(@Req() request: AuthenticatedRequest) {
    return this.workoutsService.findArchived(request.user);
  }

  // Collection routes
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.workoutsService.findAll(request.user);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateWorkoutDto) {
    return this.workoutsService.create(request.user, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(request.user, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutsService.deactivate(request.user, id);
  }

  @Patch(':id/reactivate')
  reactivate(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutsService.reactivate(request.user, id);
  }

  @Delete(':id')
  delete(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutsService.delete(request.user, id);
  }

  // Workout result routes
  @Post(':id/results')
  createResult(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateWorkoutResultDto,
  ) {
    return this.workoutResultsService.createResult(
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
    return this.workoutResultsService.updateResult(
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
    return this.workoutResultsService.deleteResult(
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
    return this.workoutResultsService.findResultSummary(
      request.user.userId,
      id,
    );
  }

  @Get(':id/results')
  findResults(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutResultsService.findResults(request.user.userId, id);
  }

  // Dynamic route LAST
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutsService.findOne(id, request.user);
  }
}
