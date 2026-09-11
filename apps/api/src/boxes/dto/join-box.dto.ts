import { IsString, Length } from 'class-validator';

export class JoinBoxDto {
  @IsString()
  @Length(6, 12)
  joinCode: string;
}
