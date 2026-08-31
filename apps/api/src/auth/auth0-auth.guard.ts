import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type Auth0User = {
  sub: string;
  email?: string;
};

export type Auth0AuthenticatedRequest = Request & {
  auth0User?: Auth0User;
};

@Injectable()
export class Auth0AuthGuard implements CanActivate {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configService: ConfigService) {
    const domain = this.configService.getOrThrow<string>('AUTH0_DOMAIN');

    this.audience = this.configService.getOrThrow<string>('AUTH0_AUDIENCE');

    this.issuer = `https://${domain}/`;

    this.jwks = createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Auth0AuthenticatedRequest>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const { payload } = await jwtVerify<JWTPayload>(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Token subject is missing');
      }

      request.auth0User = {
        sub: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
