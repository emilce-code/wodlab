import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() request: AuthenticatedRequest) {
    const user = await this.usersService.findById(request.user.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      athleteProfile: user.athleteProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}