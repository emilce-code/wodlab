import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachProgrammingService } from './coach-programming.service';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { ApplyProgramTemplateDto } from './dto/apply-program-template.dto';
import { CreateCoachGroupDto } from './dto/create-coach-group.dto';
import { CreateProgramTemplateDto } from './dto/create-program-template.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('coach-programming')
@UseGuards(JwtAuthGuard)
export class CoachProgrammingController {
  constructor(private readonly service: CoachProgrammingService) {}

  @Get('workspace')
  getWorkspace(@Req() request: AuthenticatedRequest) {
    return this.service.getWorkspace(request.user.userId);
  }

  @Post('groups')
  createGroup(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCoachGroupDto,
  ) {
    return this.service.createGroup(request.user.userId, dto);
  }

  @Delete('groups/:id')
  deleteGroup(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteGroup(request.user.userId, id);
  }

  @Post('groups/:id/members')
  addGroupMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AddGroupMemberDto,
  ) {
    return this.service.addGroupMember(
      request.user.userId,
      id,
      dto.athleteProfileId,
    );
  }

  @Delete('groups/:groupId/members/:athleteProfileId')
  removeGroupMember(
    @Req() request: AuthenticatedRequest,
    @Param('groupId') groupId: string,
    @Param('athleteProfileId') athleteProfileId: string,
  ) {
    return this.service.removeGroupMember(
      request.user.userId,
      groupId,
      athleteProfileId,
    );
  }

  @Post('templates')
  createTemplate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateProgramTemplateDto,
  ) {
    return this.service.createTemplate(request.user.userId, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.deleteTemplate(request.user.userId, id);
  }

  @Post('templates/:id/apply')
  applyTemplate(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ApplyProgramTemplateDto,
  ) {
    return this.service.applyTemplate(request.user.userId, id, dto);
  }
}
