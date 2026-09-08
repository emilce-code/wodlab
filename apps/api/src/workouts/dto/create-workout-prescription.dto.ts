import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

import { WeightUnit } from '../../../generated/prisma/enums';

export class CreateWorkoutPrescriptionDto {
  @IsString()
  categoryKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  percentage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  referenceRepMax?: number;

  @IsOptional()
  @IsString()
  referenceMovementId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
