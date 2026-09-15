import { PrismaService } from '../prisma/prisma.service';
import { Auth0AuthGuard } from './auth0-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const auth0AuthGuard = {} as Auth0AuthGuard;
    const prisma = {} as PrismaService;

    expect(new JwtAuthGuard(auth0AuthGuard, prisma)).toBeDefined();
  });
});
