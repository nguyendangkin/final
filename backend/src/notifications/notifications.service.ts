import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { SystemAnnouncement } from './entities/system-announcement.entity';
import { UserAnnouncementRead } from './entities/user-announcement-read.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
        @InjectRepository(SystemAnnouncement)
        private announcementRepo: Repository<SystemAnnouncement>,
        @InjectRepository(UserAnnouncementRead)
        private readRepo: Repository<UserAnnouncementRead>,
    ) { }

    // ==================== USER NOTIFICATIONS ====================

    async getUserNotifications(userId: string, page: number = 1, limit: number = 10) {
        const [items, total] = await this.notificationRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            total,
            page,
            limit,
            hasMore: page * limit < total,
        };
    }

    async markNotificationAsRead(userId: string, notificationId: string) {
        await this.notificationRepo.update(
            { id: notificationId, userId },
            { isRead: true }
        );
        return { success: true };
    }

    async markAllUserNotificationsAsRead(userId: string) {
        await this.notificationRepo.update(
            { userId, isRead: false },
            { isRead: true }
        );
        return { success: true };
    }

    async createNotification(userId: string, type: NotificationType, title: string, message: string) {
        const notification = this.notificationRepo.create({
            userId,
            type,
            title,
            message,
        });
        return this.notificationRepo.save(notification);
    }

    // ==================== SYSTEM ANNOUNCEMENTS FOR USERS ====================

    async getSystemAnnouncements(userId: string, page: number = 1, limit: number = 10) {
        const [announcements, total] = await this.announcementRepo.findAndCount({
            where: { isPublished: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });

        // Get read status for each announcement
        const readRecords = await this.readRepo.find({
            where: { userId },
        });
        const readAnnouncementIds = new Set(readRecords.map(r => r.announcementId));

        const items = announcements.map(a => ({
            ...a,
            author: a.author ? { id: a.author.id, name: a.author.name } : null,
            isRead: readAnnouncementIds.has(a.id),
        }));

        return {
            items,
            total,
            page,
            limit,
            hasMore: page * limit < total,
        };
    }

    async markAnnouncementAsRead(userId: string, announcementId: string) {
        const existing = await this.readRepo.findOne({
            where: { userId, announcementId },
        });

        if (!existing) {
            const read = this.readRepo.create({ userId, announcementId });
            await this.readRepo.save(read);
        }

        return { success: true };
    }

    async markAllAnnouncementsAsRead(userId: string) {
        const announcements = await this.announcementRepo.find({
            where: { isPublished: true },
            select: ['id'],
        });

        const readRecords = await this.readRepo.find({
            where: { userId },
            select: ['announcementId'],
        });
        const readIds = new Set(readRecords.map(r => r.announcementId));

        const newReads = announcements
            .filter(a => !readIds.has(a.id))
            .map(a => this.readRepo.create({ userId, announcementId: a.id }));

        if (newReads.length > 0) {
            await this.readRepo.save(newReads);
        }

        return { success: true };
    }

    async getAnnouncementDetail(announcementId: string) {
        return this.announcementRepo.findOne({
            where: { id: announcementId, isPublished: true },
            relations: ['author'],
        });
    }

    // ==================== UNREAD COUNTS ====================

    async getUnreadCounts(userId: string) {
        // Count unread user notifications
        const userCount = await this.notificationRepo.count({
            where: { userId, isRead: false },
        });

        // Count unread system announcements
        const totalAnnouncements = await this.announcementRepo.count({
            where: { isPublished: true },
        });
        const readAnnouncements = await this.readRepo.count({
            where: { userId },
        });
        const systemCount = totalAnnouncements - readAnnouncements;

        return {
            user: userCount,
            system: Math.max(0, systemCount),
            total: userCount + Math.max(0, systemCount),
        };
    }
}
