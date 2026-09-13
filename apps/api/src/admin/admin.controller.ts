import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  findUsers(@Query() query: FindUsersQueryDto) {
    return this.admin.findUsers(query);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.admin.updateUserRole(request.user.userId, id, dto.role);
  }
}
