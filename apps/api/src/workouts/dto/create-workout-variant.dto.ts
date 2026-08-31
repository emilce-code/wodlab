import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CreateWorkoutSectionDto } from './create-workout-section.dto';

export class CreateWorkoutVariantDto {
  @IsString()
  levelKey: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutSectionDto)
  sections: CreateWorkoutSectionDto[];
}
