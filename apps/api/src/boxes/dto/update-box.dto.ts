import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBoxDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImagePath?: string;
}
