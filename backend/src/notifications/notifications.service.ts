import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
        // Get user creation time
        const user = await this.announcementRepo.manager.findOne('User', {
            where: { id: userId },
            select: ['createdAt'],
        } as any) as any;

        if (!user) {
            return { items: [], total: 0, page, limit, hasMore: false };
        }

        const queryBuilder = this.announcementRepo.createQueryBuilder('announcement')
            .leftJoinAndSelect('announcement.author', 'author')
            .where('announcement.isPublished = :isPublished', { isPublished: true })
            .andWhere(
                '(announcement.isGlobal = :isGlobal OR announcement.createdAt >= :userCreatedAt)',
                { isGlobal: true, userCreatedAt: user.createdAt }
            )
            .orderBy('announcement.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [announcements, total] = await queryBuilder.getManyAndCount();

        // Get read status for each announcement
        const announcementIds = announcements.map(a => a.id);
        const readAnnouncementIds = new Set<string>();

        if (announcementIds.length > 0) {
            const readRecords = await this.readRepo.find({
                where: {
                    userId,
                    announcementId: In(announcementIds)
                },
                select: ['announcementId']
            });
            readRecords.forEach(r => readAnnouncementIds.add(r.announcementId));
        }

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
        // Get user for created date rule
        const user = await this.announcementRepo.manager.findOne('User', {
            where: { id: userId },
            select: ['createdAt'],
        } as any) as any;

        if (!user) return { success: false };

        // Find all VISIBLE and UNREAD announcements
        const unreads = await this.announcementRepo.createQueryBuilder('announcement')
            .leftJoin('user_announcement_read', 'read', 'read.announcementId = announcement.id AND read.userId = :userId', { userId })
            .select('announcement.id')
            .where('announcement.isPublished = :isPublished', { isPublished: true })
            .andWhere('(announcement.isGlobal = :isGlobal OR announcement.createdAt >= :userCreatedAt)', { isGlobal: true, userCreatedAt: user.createdAt })
            .andWhere('read.id IS NULL')
            .getMany();

        if (unreads.length > 0) {
            const newReads = unreads.map(a => this.readRepo.create({ userId, announcementId: a.id }));
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

        // Get user creation time for announcement filtering
        const user = await this.announcementRepo.manager.findOne('User', {
            where: { id: userId },
            select: ['createdAt'],
        } as any) as any;

        let systemCount = 0;
        if (user) {
            systemCount = await this.announcementRepo.createQueryBuilder('announcement')
                .leftJoin('user_announcement_read', 'read', 'read.announcementId = announcement.id AND read.userId = :userId', { userId })
                .where('announcement.isPublished = :isPublished', { isPublished: true })
                .andWhere('(announcement.isGlobal = :isGlobal OR announcement.createdAt >= :userCreatedAt)', { isGlobal: true, userCreatedAt: user.createdAt })
                .andWhere('read.id IS NULL') // Unread check
                .getCount();
        }

        return {
            user: userCount,
            system: systemCount,
            total: userCount + systemCount,
        };
    }
}
