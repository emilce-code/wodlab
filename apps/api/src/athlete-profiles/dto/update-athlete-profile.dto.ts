import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { WeightUnit } from '../../../generated/prisma/enums';

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
}
