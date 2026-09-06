import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachesService } from './coaches.service';
import { AssignWorkoutDto } from './dto/assign-workout.dto';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { InviteAthleteDto } from './dto/invite-athlete.dto';
import { RespondInvitationDto } from './dto/respond-invitation.dto';
import { ReviewAssignmentDto } from './dto/review-assignment.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Get('workspace')
  getWorkspace(@Req() request: AuthenticatedRequest) {
    return this.coachesService.getWorkspace(request.user.userId);
  }

  @Post('profile')
  createProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCoachProfileDto,
  ) {
    return this.coachesService.createProfile(request.user.userId, dto);
  }

  @Get('assignment-options')
  getAssignmentOptions(@Req() request: AuthenticatedRequest) {
    return this.coachesService.getAssignmentOptions(request.user.userId);
  }

  @Post('invitations')
  inviteAthlete(
    @Req() request: AuthenticatedRequest,
    @Body() dto: InviteAthleteDto,
  ) {
    return this.coachesService.inviteAthlete(request.user.userId, dto.email);
  }

  @Patch('invitations/:id')
  respondToInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RespondInvitationDto,
  ) {
    return this.coachesService.respondToInvitation(
      request.user.userId,
      id,
      dto.response,
    );
  }

  @Delete('relationships/:id')
  archiveRelationship(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.coachesService.archiveRelationship(request.user.userId, id);
  }

  @Get('athletes/:athleteProfileId')
  getAthleteOverview(
    @Req() request: AuthenticatedRequest,
    @Param('athleteProfileId') athleteProfileId: string,
  ) {
    return this.coachesService.getAthleteOverview(
      request.user.userId,
      athleteProfileId,
    );
  }

  @Post('athletes/:athleteProfileId/assignments')
  assignWorkout(
    @Req() request: AuthenticatedRequest,
    @Param('athleteProfileId') athleteProfileId: string,
    @Body() dto: AssignWorkoutDto,
  ) {
    return this.coachesService.assignWorkout(
      request.user.userId,
      athleteProfileId,
      dto,
    );
  }

  @Patch('assignments/:id/review')
  reviewAssignment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewAssignmentDto,
  ) {
    return this.coachesService.reviewAssignment(request.user.userId, id, dto);
  }
}
