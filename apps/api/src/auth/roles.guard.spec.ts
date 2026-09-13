import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

function context(role: 'USER' | 'COACH' | 'ADMIN') {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  } as never;
}

describe('RolesGuard', () => {
  it('allows an authorized role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['COACH', 'ADMIN']),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context('COACH'))).toBe(true);
  });

  it('rejects an unauthorized role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    expect(() =>
      new RolesGuard(reflector).canActivate(context('USER')),
    ).toThrow(ForbiddenException);
  });
});
