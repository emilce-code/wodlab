import { IsIn } from 'class-validator';

export class UpdateBoxMemberDto {
  @IsIn(['COACH', 'ATHLETE'])
  role: 'COACH' | 'ATHLETE';
}
