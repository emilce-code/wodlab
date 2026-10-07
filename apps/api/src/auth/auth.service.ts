import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { permissionsForRole } from './permissions';

type SupportedLocale = 'en' | 'es' | 'pt';

type ProvisionAuth0UserInput = {
  auth0UserId: string;
  email: string;
  displayName: string;
  preferredLocale?: SupportedLocale;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionAuth0User(input: ProvisionAuth0UserInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        auth0UserId: input.auth0UserId,
      },

      include: currentUserInclude,
    });

    if (existingUser) {
      return toCurrentUser(existingUser);
    }

    const user = await this.prisma.user.create({
      data: {
        auth0UserId: input.auth0UserId,

        email: input.email,

        preferredLocale: input.preferredLocale ?? 'es',

        athleteProfile: {
          create: {
            displayName: input.displayName,
          },
        },
      },

      include: currentUserInclude,
    });

    return toCurrentUser(user);
  }
}

const athleteProfileInclude = {
  preferredWorkoutLevel: true,
  preferredPrescriptionCategory: true,
} as const;

const currentUserInclude = {
  athleteProfile: {
    include: athleteProfileInclude,
  },
  boxMemberships: {
    where: {
      status: 'ACTIVE' as const,
    },
    include: {
      role: true,
    },
  },
} as const;

type CurrentUserRecord = {
  id: string;
  email: string;
  role: 'USER' | 'COACH' | 'ADMIN';
  preferredLocale: string;
  athleteProfile: unknown;
  boxMemberships: Array<{ role: { key: string } }>;
  createdAt: Date;
  updatedAt: Date;
};

function toCurrentUser(user: CurrentUserRecord) {
  const permissions = permissionsForRole(user.role);
  const ownsABox = user.boxMemberships.some(
    (membership) => membership.role.key === 'OWNER',
  );

  if (ownsABox && !permissions.includes('box:manage')) {
    permissions.push('box:manage');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    preferredLocale: user.preferredLocale,
    permissions,
    athleteProfile: user.athleteProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
