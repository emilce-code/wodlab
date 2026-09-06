import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AssignWorkoutDto {
  @IsString()
  workoutId: string;

  @IsString()
  workoutVariantId: string;

  @IsOptional()
  @IsString()
  prescriptionCategoryKey?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachNotes?: string;
}
