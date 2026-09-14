import { IsString, MinLength } from 'class-validator';

export class SetActiveBoxDto {
  @IsString()
  @MinLength(1)
  boxId!: string;
}
