import {
  IsArray,
  IsEnum,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

import { WeightUnit } from '../../../generated/prisma/enums';
import { CreateWorkoutPrescriptionDto } from './create-workout-prescription.dto';

export class CreateWorkoutMovementDto {
  @IsString()
  movementId: string;

  @IsInt()
  @Min(1)
  order: number;

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

  @ValidateIf(
    (movement: CreateWorkoutMovementDto) => movement.percentage !== undefined,
  )
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(20)
  referenceRepMax?: number;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutPrescriptionDto)
  prescriptions?: CreateWorkoutPrescriptionDto[];
}
