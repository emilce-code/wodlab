import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { MovementsService } from './movements.service';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: FindMovementsQueryDto) {
    return this.movementsService.findAll(query);
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
}