import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class FindCoachMonitoringQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  athleteProfileId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @Type(() => String)
  @IsIn(['ALL', 'PLANNED', 'COMPLETED', 'OVERDUE', 'NEEDS_REVIEW'])
  status?: 'ALL' | 'PLANNED' | 'COMPLETED' | 'OVERDUE' | 'NEEDS_REVIEW';
}
