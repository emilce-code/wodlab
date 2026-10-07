import { IsEmail, IsIn } from 'class-validator';

export class AssignBoxMemberDto {
  @IsEmail()
  email: string;

  @IsIn(['OWNER', 'COACH', 'ATHLETE'])
  role: 'OWNER' | 'COACH' | 'ATHLETE';
}
