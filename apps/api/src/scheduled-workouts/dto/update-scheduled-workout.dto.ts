import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateScheduledWorkoutDto {
  @IsOptional()
  @IsString()
  workoutVariantId?: string;

  @IsOptional()
  @IsString()
  prescriptionCategoryKey?: string | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
