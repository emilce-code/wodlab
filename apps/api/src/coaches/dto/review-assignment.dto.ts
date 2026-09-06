import { IsString, MaxLength } from 'class-validator';

export class ReviewAssignmentDto {
  @IsString()
  @MaxLength(2000)
  feedback: string;
}
