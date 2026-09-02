import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';

import {
  Auth0AuthGuard,
  type Auth0AuthenticatedRequest,
} from '../auth/auth0-auth.guard';

import { UsersService } from './users.service';
import { AthleteInsightsService } from './athlete-insights.service';
import { AthletePerformanceInsightsService } from './athlete-performance-insights.service';
import { FindAthleteInsightsQueryDto } from './dto/find-athlete-insights-query.dto';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

type ProvisionUserDto = {
  email: string;
  displayName: string;
};

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly athleteInsightsService: AthleteInsightsService,
    private readonly athletePerformanceInsightsService: AthletePerformanceInsightsService,
  ) {}

  @UseGuards(Auth0AuthGuard)
  @Post('users/provision')
  async provision(
    @Req()
    request: Auth0AuthenticatedRequest,

    @Body()
    body: ProvisionUserDto,
  ) {
    const auth0UserId = request.auth0User?.sub;

    if (!auth0UserId) {
      throw new UnauthorizedException('Authenticated user subject is missing');
    }

    return this.usersService.findOrCreateFromAuth0({
      auth0UserId,
      email: body.email,
      displayName: body.displayName,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/insights/performance')
  getPerformanceInsights(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindAthleteInsightsQueryDto,
  ) {
    return this.athletePerformanceInsightsService.getPerformance(
      request.user.userId,
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/dashboard')
  getDashboard(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.usersService.getDashboard(request.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/insights/consistency')
  getConsistencyInsights(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindAthleteInsightsQueryDto,
  ) {
    return this.athleteInsightsService.getConsistency(
      request.user.userId,
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(
    @Req()
    request: AuthenticatedRequest,
  ) {
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
