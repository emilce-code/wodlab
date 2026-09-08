import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FindCoachAnalyticsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  athleteProfileId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}
