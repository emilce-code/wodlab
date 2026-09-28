import {
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateWorkoutMovementDto } from './create-workout-movement.dto';

export class CreateWorkoutSectionDto {
  @IsString()
  typeKey: string;

  @IsOptional()
  @IsIn(['WARM_UP', 'STRENGTH', 'WOD', 'ACCESSORY', 'COOLDOWN', 'CUSTOM'])
  role?: 'WARM_UP' | 'STRENGTH' | 'WOD' | 'ACCESSORY' | 'COOLDOWN' | 'CUSTOM';

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rounds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  repScheme?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutMovementDto)
  movements: CreateWorkoutMovementDto[];
}
