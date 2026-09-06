import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCoachProfileDto {
  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
