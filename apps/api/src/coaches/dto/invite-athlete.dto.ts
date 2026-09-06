import { IsEmail } from 'class-validator';

export class InviteAthleteDto {
  @IsEmail()
  email: string;
}
