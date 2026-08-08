import {
  Body,
  Controller,
  Get,
  Param,
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
import { WorkoutsService } from './workouts.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // Static routes FIRST
  @Get('types')
  findWorkoutTypes() {
    return this.workoutsService.findWorkoutTypes();
  }

  @Get('result-types')
  findResultTypes() {
    return this.workoutsService.findResultTypes();
  }

  // Collection route
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

  // Dynamic route LAST
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutsService.findOne(id);
  }
}