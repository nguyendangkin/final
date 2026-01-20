import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Notification } from './entities/notification.entity';
import { SystemAnnouncement } from './entities/system-announcement.entity';
import { UserAnnouncementRead } from './entities/user-announcement-read.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      SystemAnnouncement,
      UserAnnouncementRead,
    ]),
  ],
  controllers: [NotificationsController, AnnouncementsController],
  providers: [NotificationsService, AnnouncementsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
