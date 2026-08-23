import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import { AthleteProfilesService } from './athlete-profiles.service';
import { UpdateAthleteProfileDto } from './dto/update-athlete-profile.dto';

type AuthenticatedRequest =
  Request & {
    user: AuthenticatedUser;
  };

@Controller('athlete-profile')
@UseGuards(JwtAuthGuard)
export class AthleteProfilesController {
  constructor(
    private readonly athleteProfilesService: AthleteProfilesService,
  ) {}

  @Get()
  async getProfile(
    @Req()
    request: AuthenticatedRequest,
  ) {
    const profile =
      await this.athleteProfilesService.findByUserId(
        request.user.userId,
      );

    if (!profile) {
      throw new NotFoundException(
        'Athlete profile not found',
      );
    }

    return profile;
  }

  @Patch()
  async updateProfile(
    @Req()
    request: AuthenticatedRequest,

    @Body()
    dto: UpdateAthleteProfileDto,
  ) {
    return this.athleteProfilesService.updateByUserId(
      request.user.userId,
      dto,
    );
  }
}