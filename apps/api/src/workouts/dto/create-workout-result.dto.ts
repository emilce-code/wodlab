import {
  Type,
} from 'class-transformer';

import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  WeightUnit,
} from '../../../generated/prisma/enums';

export class CreateWorkoutResultMovementDto {
  @IsString()
  workoutMovementId: string;

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

export class CreateWorkoutResultDto {
  @IsString()
  workoutVariantId: string;

  @IsOptional()
  @IsString()
  prescriptionCategoryKey?: string;

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
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      CreateWorkoutResultMovementDto,
  )
  movements?: CreateWorkoutResultMovementDto[];
}