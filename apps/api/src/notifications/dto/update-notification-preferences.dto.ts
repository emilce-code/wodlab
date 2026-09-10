import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  workoutReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  coachUpdates?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7)
  reminderLeadDays?: number;
}
