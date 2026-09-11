import { IsIn, IsOptional, IsString } from 'class-validator';

export const leaderboardPeriods = ['30D', '90D', 'ALL'] as const;
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number];

export class FindWorkoutLeaderboardQueryDto {
  @IsString()
  variantId!: string;

  @IsOptional()
  @IsIn(leaderboardPeriods)
  period: LeaderboardPeriod = '30D';
}
