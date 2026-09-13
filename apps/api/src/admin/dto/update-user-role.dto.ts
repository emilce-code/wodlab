import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['USER', 'COACH', 'ADMIN'])
  role: 'USER' | 'COACH' | 'ADMIN';
}
