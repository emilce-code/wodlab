import { IsIn } from 'class-validator';

export class UpdateBoxMemberDto {
  @IsIn(['OWNER', 'COACH', 'ATHLETE'])
  role: 'OWNER' | 'COACH' | 'ATHLETE';
}
