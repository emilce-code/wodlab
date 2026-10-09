import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('exposes box management navigation for organization owners without box memberships', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner-1',
      email: 'owner@example.com',
      role: 'USER',
      preferredLocale: 'en',
      athleteProfile: null,
      boxMemberships: [],
      boxOrganizationsOwned: [{ id: 'ownership-1' }],
    });
    const user = await service.provisionAuth0User({
      auth0UserId: 'auth0|owner',
      email: 'owner@example.com',
      displayName: 'Owner',
    });
    expect(user.permissions).toContain('box:manage');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
