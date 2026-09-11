import { IsOptional, IsString } from 'class-validator';

export class FindWorkoutStrategyQueryDto {
  @IsOptional()
  @IsString()
  variantId?: string;
}
