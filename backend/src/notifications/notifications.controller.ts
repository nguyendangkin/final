import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('type') type: 'user' | 'system' = 'user',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.id;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (type === 'system') {
      return this.notificationsService.getSystemAnnouncements(
        userId,
        pageNum,
        limitNum,
      );
    }
    return this.notificationsService.getUserNotifications(
      userId,
      pageNum,
      limitNum,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCounts(req.user.id);
  }

  @Get('announcement/:id')
  async getAnnouncementDetail(@Param('id') id: string) {
    return this.notificationsService.getAnnouncementDetail(id);
  }

  @Put(':id/read')
  async markAsRead(
    @Request() req,
    @Param('id') id: string,
    @Query('type') type: 'user' | 'system' = 'user',
  ) {
    const userId = req.user.id;
    if (type === 'system') {
      return this.notificationsService.markAnnouncementAsRead(userId, id);
    }
    return this.notificationsService.markNotificationAsRead(userId, id);
  }

  @Put('mark-all-read')
  async markAllAsRead(
    @Request() req,
    @Query('type') type: 'user' | 'system' = 'user',
  ) {
    const userId = req.user.id;
    if (type === 'system') {
      return this.notificationsService.markAllAnnouncementsAsRead(userId);
    }
    return this.notificationsService.markAllUserNotificationsAsRead(userId);
  }
}
