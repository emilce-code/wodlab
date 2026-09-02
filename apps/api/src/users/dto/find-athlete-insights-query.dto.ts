import { IsEnum, IsOptional } from 'class-validator';

export enum AthleteInsightsPeriod {
  THIRTY_DAYS = '30D',
  NINETY_DAYS = '90D',
  SIX_MONTHS = '6M',
  ONE_YEAR = '1Y',
  ALL_TIME = 'ALL',
}

export class FindAthleteInsightsQueryDto {
  @IsOptional()
  @IsEnum(AthleteInsightsPeriod)
  period: AthleteInsightsPeriod = AthleteInsightsPeriod.NINETY_DAYS;
}
