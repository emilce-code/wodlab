import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type Auth0UserInput = {
  auth0UserId: string;
  email: string;
  displayName: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        athleteProfile: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        athleteProfile: true,
      },
    });
  }

  findByAuth0UserId(
    auth0UserId: string,
  ) {
    return this.prisma.user.findUnique({
      where: {
        auth0UserId,
      },
      include: {
        athleteProfile: true,
      },
    });
  }

  async findOrCreateFromAuth0(
    input: Auth0UserInput,
  ) {
    const existingUser =
      await this.findByAuth0UserId(
        input.auth0UserId,
      );

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        auth0UserId:
          input.auth0UserId,

        email:
          input.email,

        athleteProfile: {
          create: {
            displayName:
              input.displayName,
          },
        },
      },

      include: {
        athleteProfile: true,
      },
    });
  }
}