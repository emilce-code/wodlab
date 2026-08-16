import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Auth0AuthGuard } from './auth0-auth.guard';
import type { Auth0AuthenticatedRequest } from './auth0-auth.guard';

@Controller('auth0-test')
export class Auth0TestController {
  @Get()
  @UseGuards(Auth0AuthGuard)
  getAuth0Identity(
    @Req()
    request: Auth0AuthenticatedRequest,
  ) {
    return {
      authenticated: true,
      sub: request.auth0User?.sub,
      email:
        request.auth0User?.email ??
        null,
    };
  }
}