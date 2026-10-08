import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BoxesService } from './boxes.service';
import { CreateBoxOrganizationDto } from './dto/create-box-organization.dto';
import { CreateBoxDto } from './dto/create-box.dto';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { FindClassSessionsQueryDto } from './dto/find-class-sessions-query.dto';
import { JoinBoxDto } from './dto/join-box.dto';
import { SetActiveBoxDto } from './dto/set-active-box.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { UpdateBoxOrganizationDto } from './dto/update-box-organization.dto';
import { UpdateBoxDto } from './dto/update-box.dto';
import { UpdateBoxMemberDto } from './dto/update-box-member.dto';
import { AssignBoxMemberDto } from './dto/assign-box-member.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('boxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoxesController {
  constructor(private readonly boxes: BoxesService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.boxes.findAll(request.user.userId);
  }

  @Get('administration')
  @Roles('ADMIN')
  findAllForAdministration() {
    return this.boxes.findAllForAdministration();
  }

  @Get('organizations')
  @Roles('ADMIN')
  findOrganizationsForAdministration() {
    return this.boxes.findOrganizationsForAdministration();
  }

  @Post('organizations')
  @Roles('ADMIN')
  createOrganization(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBoxOrganizationDto,
  ) {
    return this.boxes.createOrganization(request.user.userId, dto);
  }

  @Patch('organizations/:organizationId')
  @Roles('ADMIN')
  updateOrganization(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateBoxOrganizationDto,
  ) {
    return this.boxes.updateOrganization(
      request.user.userId,
      organizationId,
      dto,
    );
  }

  @Post()
  @Roles('ADMIN')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateBoxDto) {
    return this.boxes.create(request.user.userId, dto);
  }

  @Post('join')
  join(@Req() request: AuthenticatedRequest, @Body() dto: JoinBoxDto) {
    return this.boxes.join(request.user.userId, dto.joinCode);
  }

  @Patch('active')
  setActiveBox(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SetActiveBoxDto,
  ) {
    return this.boxes.setActiveBox(request.user.userId, dto.boxId);
  }

  @Patch(':boxId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Body() dto: UpdateBoxDto,
  ) {
    return this.boxes.update(request.user.userId, boxId, dto);
  }

  @Get(':boxId/options')
  options(@Req() request: AuthenticatedRequest, @Param('boxId') boxId: string) {
    return this.boxes.options(request.user.userId, boxId);
  }

  @Get(':boxId/members')
  members(@Req() request: AuthenticatedRequest, @Param('boxId') boxId: string) {
    return this.boxes.findMembers(request.user.userId, boxId);
  }

  @Post(':boxId/members')
  assignMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Body() dto: AssignBoxMemberDto,
  ) {
    return this.boxes.assignMember(
      request.user.userId,
      boxId,
      dto.email,
      dto.role,
    );
  }

  @Patch(':boxId/members/:memberId')
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateBoxMemberDto,
  ) {
    return this.boxes.updateMember(
      request.user.userId,
      boxId,
      memberId,
      dto.role,
    );
  }

  @Post(':boxId/members/:memberId/approve')
  approveMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.boxes.approveMember(request.user.userId, boxId, memberId);
  }

  @Post(':boxId/members/:memberId/reactivate')
  reactivateMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.boxes.reactivateMember(request.user.userId, boxId, memberId);
  }

  @Post(':boxId/members/:memberId/deactivate')
  deactivateMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.boxes.deactivateMember(request.user.userId, boxId, memberId);
  }

  @Post(':boxId/leave')
  leave(@Req() request: AuthenticatedRequest, @Param('boxId') boxId: string) {
    return this.boxes.leave(request.user.userId, boxId);
  }

  @Delete(':boxId/members/:memberId')
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.boxes.removeMember(request.user.userId, boxId, memberId);
  }

  @Post(':boxId/join-code')
  rotateJoinCode(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
  ) {
    return this.boxes.rotateJoinCode(request.user.userId, boxId);
  }

  @Get(':boxId/classes')
  findClasses(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Query() query: FindClassSessionsQueryDto,
  ) {
    return this.boxes.findClasses(request.user.userId, boxId, query);
  }

  @Post(':boxId/classes')
  createClass(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Body() dto: CreateClassSessionDto,
  ) {
    return this.boxes.createClass(request.user.userId, boxId, dto);
  }

  @Patch(':boxId/classes/:classId')
  updateClass(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('classId') classId: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.boxes.updateClass(request.user.userId, boxId, classId, dto);
  }

  @Delete(':boxId/classes/:classId')
  deleteClass(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('classId') classId: string,
  ) {
    return this.boxes.deleteClass(request.user.userId, boxId, classId);
  }

  @Post(':boxId/classes/:classId/book')
  book(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('classId') classId: string,
  ) {
    return this.boxes.book(request.user.userId, boxId, classId);
  }

  @Delete(':boxId/classes/:classId/book')
  cancelBooking(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('classId') classId: string,
  ) {
    return this.boxes.cancelBooking(request.user.userId, boxId, classId);
  }

  @Patch(':boxId/classes/:classId/attendance')
  attendance(
    @Req() request: AuthenticatedRequest,
    @Param('boxId') boxId: string,
    @Param('classId') classId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.boxes.attendance(
      request.user.userId,
      boxId,
      classId,
      dto.userId,
      dto.status,
    );
  }
}
