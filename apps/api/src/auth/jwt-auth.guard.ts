import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { Auth0AuthGuard } from './auth0-auth.guard';
import type { Auth0AuthenticatedRequest } from './auth0-auth.guard';

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

type AuthenticatedRequest =
  Auth0AuthenticatedRequest &
    Request & {
      user?: AuthenticatedUser;
    };

@Injectable()
export class JwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly auth0AuthGuard: Auth0AuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    await this.auth0AuthGuard.canActivate(
      context,
    );

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const auth0UserId =
      request.auth0User?.sub;

    if (!auth0UserId) {
      throw new UnauthorizedException(
        'Authenticated user subject is missing',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          auth0UserId,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'WODLY user has not been provisioned',
      );
    }

    request.user = {
      userId: user.id,
      email: user.email,
    };

    return true;
  }
}