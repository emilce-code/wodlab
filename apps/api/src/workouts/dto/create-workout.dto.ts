import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateWorkoutSectionDto } from './create-workout-section.dto';

export class CreateWorkoutDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  typeKey: string;

  @IsOptional()
  @IsBoolean()
  isBenchmark?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutSectionDto)
  sections: CreateWorkoutSectionDto[];
}