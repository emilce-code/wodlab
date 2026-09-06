import { Matches } from 'class-validator';

export class FindWeeklyPlanQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  weekStart: string;
}
