import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.notifications.findAll(request.user.userId);
  }

  @Patch('read-all')
  readAll(@Req() request: AuthenticatedRequest) {
    return this.notifications.readAll(request.user.userId);
  }

  @Get('preferences')
  getPreferences(@Req() request: AuthenticatedRequest) {
    return this.notifications.getPreferences(request.user.userId);
  }

  @Patch('preferences')
  updatePreferences(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notifications.updatePreferences(request.user.userId, dto);
  }

  @Patch(':key/read')
  markRead(@Req() request: AuthenticatedRequest, @Param('key') key: string) {
    return this.notifications.markRead(request.user.userId, key);
  }

  @Delete(':key')
  dismiss(@Req() request: AuthenticatedRequest, @Param('key') key: string) {
    return this.notifications.dismiss(request.user.userId, key);
  }
}
