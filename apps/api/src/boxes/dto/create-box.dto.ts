import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBoxDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

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

  @IsOptional()\n  @IsString()\n  @MaxLength(500)\n  logoPath?: string;\n\n  @IsOptional()\n  @IsString()\n  @MaxLength(500)\n  coverImagePath?: string;\n}
