import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseWorkoutTextDto } from './dto/parse-workout-text.dto';
import { WorkoutImportsService } from './workout-imports.service';

@Controller('workout-imports')
@UseGuards(JwtAuthGuard)
export class WorkoutImportsController {
  constructor(private readonly imports: WorkoutImportsService) {}

  @Post('parse')
  parse(@Body() dto: ParseWorkoutTextDto) {
    return this.imports.parse(dto.text);
  }
}
