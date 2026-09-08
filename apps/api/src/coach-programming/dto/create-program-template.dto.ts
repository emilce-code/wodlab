import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProgramTemplateItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOffset: number;

  @IsString()
  workoutId: string;

  @IsString()
  workoutVariantId: string;

  @IsOptional()
  @IsString()
  prescriptionCategoryKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachNotes?: string;
}

export class CreateProgramTemplateDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramTemplateItemDto)
  items: CreateProgramTemplateItemDto[];
}
