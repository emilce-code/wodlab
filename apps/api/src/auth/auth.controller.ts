import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { Auth0AuthGuard } from './auth0-auth.guard';
import type { Auth0AuthenticatedRequest } from './auth0-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ProvisionAuth0UserDto } from './dto/provision-auth0-user.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Post('provision')
  @UseGuards(Auth0AuthGuard)
  provision(
    @Req()
    request: Auth0AuthenticatedRequest,

    @Body()
    dto: ProvisionAuth0UserDto,
  ) {
    const auth0UserId =
      request.auth0User?.sub;

    if (!auth0UserId) {
      throw new Error(
        'Authenticated user subject is missing',
      );
    }

    return this.usersService.findOrCreateFromAuth0({
      auth0UserId,
      email: dto.email,
      displayName: dto.displayName,
    });
  }
}