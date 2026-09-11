import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClassSessionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  startsAt: string;

  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  @Max(200)
  capacity: number;

  @IsOptional()
  @IsString()
  workoutId?: string;

  @IsOptional()
  @IsString()
  workoutVariantId?: string;
}
