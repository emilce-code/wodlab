import { IsString, MaxLength, MinLength } from 'class-validator';

export class ParseWorkoutTextDto {
  @IsString()
  @MinLength(3)
  @MaxLength(10000)
  text: string;
}
