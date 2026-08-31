import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ProvisionAuth0UserInput = {
  auth0UserId: string;
  email: string;
  displayName: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionAuth0User(input: ProvisionAuth0UserInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        auth0UserId: input.auth0UserId,
      },

      include: {
        athleteProfile: true,
      },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        auth0UserId: input.auth0UserId,

        email: input.email,

        athleteProfile: {
          create: {
            displayName: input.displayName,
          },
        },
      },

      include: {
        athleteProfile: true,
      },
    });
  }
}
