import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import { CreateMovementResultDto } from './dto/create-movement-result.dto';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { MovementsService } from './movements.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('movements')
export class MovementsController {
  constructor(
    private readonly movementsService: MovementsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query()
    query: FindMovementsQueryDto,
  ) {
    return this.movementsService.findAll(
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  findCategories() {
    return this.movementsService.findCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Get('measurement-types')
  findMeasurementTypes() {
    return this.movementsService.findMeasurementTypes();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id')
    movementId: string,
  ) {
    return this.movementsService.findOne(
      movementId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/results')
  createResult(
    @Param('id')
    movementId: string,

    @Req()
    request: AuthenticatedRequest,

    @Body()
    dto: CreateMovementResultDto,
  ) {
    return this.movementsService.createResult(
      movementId,
      request.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/results')
  findResults(
    @Param('id')
    movementId: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.movementsService.findResults(
      movementId,
      request.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/results/summary')
  findResultSummary(
    @Param('id')
    movementId: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.movementsService.findResultSummary(
      movementId,
      request.user.userId,
    );
  }
}