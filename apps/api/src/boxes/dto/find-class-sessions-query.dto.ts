import { IsDateString, IsOptional } from 'class-validator';

export class FindClassSessionsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
