import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Auth0AuthGuard } from './auth0-auth.guard';
import type { Auth0AuthenticatedRequest } from './auth0-auth.guard';
import { AuthService } from './auth.service';
import { ProvisionAuth0UserDto } from './dto/provision-auth0-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('provision')
  @UseGuards(Auth0AuthGuard)
  provision(
    @Req()
    request: Auth0AuthenticatedRequest,

    @Body()
    dto: ProvisionAuth0UserDto,
  ) {
    const auth0UserId = request.auth0User?.sub;

    if (!auth0UserId) {
      throw new UnauthorizedException('Authenticated user subject is missing');
    }

    return this.authService.provisionAuth0User({
      auth0UserId,
      email: dto.email,
      displayName: dto.displayName,
    });
  }
}
