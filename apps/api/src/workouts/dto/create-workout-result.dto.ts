import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { WeightUnit } from '../../../generated/prisma/enums';

export class CreateWorkoutResultDto {
  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rounds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  load?: number;

  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsBoolean()
  isRx?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}