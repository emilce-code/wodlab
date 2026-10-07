import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClassSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  workoutId?: string | null;

  @IsOptional()
  @IsString()
  workoutVariantId?: string | null;
}
