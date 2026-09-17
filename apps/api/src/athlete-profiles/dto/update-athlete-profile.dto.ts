import {
  IsBoolean,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  AthleteTrainingGoal,
  WeightUnit,
} from '../../../generated/prisma/enums';

export class UpdateAthleteProfileDto {
  @IsOptional()
  @IsBoolean()
  leaderboardEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsEnum(WeightUnit)
  preferredWeightUnit?: WeightUnit;

  @IsOptional()
  @IsString()
  preferredWorkoutLevelKey?: string | null;

  @IsOptional()
  @IsString()
  preferredPrescriptionCategoryKey?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string | null;

  @IsOptional()
  @IsArray()
  @IsEnum(AthleteTrainingGoal, { each: true })
  trainingGoals?: AthleteTrainingGoal[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyTrainingTarget?: number | null;

  @IsOptional()
  @IsIn([0.5, 1, 2.5, 5])
  loadRoundingIncrement?: number | null;
}
