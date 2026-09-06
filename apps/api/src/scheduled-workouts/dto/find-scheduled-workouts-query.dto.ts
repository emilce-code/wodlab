import { IsEnum, IsOptional, Matches } from 'class-validator';

import { ScheduledWorkoutStatus } from '../../../generated/prisma/enums';

export class FindScheduledWorkoutsQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsEnum(ScheduledWorkoutStatus)
  status?: ScheduledWorkoutStatus;
}
