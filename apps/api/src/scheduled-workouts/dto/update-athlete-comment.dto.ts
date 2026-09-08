import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAthleteCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string | null;
}
