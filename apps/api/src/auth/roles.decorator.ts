import { SetMetadata } from '@nestjs/common';

export type AppRole = 'USER' | 'COACH' | 'ADMIN';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
