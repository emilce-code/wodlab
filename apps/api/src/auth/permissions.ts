import type { AppRole } from './roles.decorator';

export const permissionsByRole = {
  USER: ['athlete:use'],
  COACH: ['athlete:use', 'coach:use', 'box:manage'],
  ADMIN: [
    'athlete:use',
    'coach:use',
    'box:manage',
    'box:create',
    'users:manage',
    'catalog:manage',
  ],
} as const satisfies Record<AppRole, readonly string[]>;

export function permissionsForRole(role: AppRole): string[] {
  return [...permissionsByRole[role]];
}
