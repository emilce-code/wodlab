import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class FindMovementsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  measurementType?: string;

  @IsOptional()
  @IsBooleanString()
  foundational?: string;
}