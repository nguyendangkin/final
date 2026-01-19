import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemAnnouncement } from './entities/system-announcement.entity';

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(SystemAnnouncement)
        private announcementRepo: Repository<SystemAnnouncement>,
    ) { }

    async create(authorId: string, dto: { title: string; content: string }) {
        const announcement = this.announcementRepo.create({
            title: dto.title,
            content: dto.content,
            authorId,
            isPublished: true,
        });
        return this.announcementRepo.save(announcement);
    }

    async findAll(page: number = 1, limit: number = 10) {
        const [items, total] = await this.announcementRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });

        const mappedItems = items.map(a => ({
            ...a,
            author: a.author ? { id: a.author.id, name: a.author.name } : null,
        }));

        return {
            items: mappedItems,
            total,
            page,
            limit,
            hasMore: page * limit < total,
        };
    }

    async findOne(id: string) {
        const announcement = await this.announcementRepo.findOne({
            where: { id },
            relations: ['author'],
        });

        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }

        return {
            ...announcement,
            author: announcement.author ? { id: announcement.author.id, name: announcement.author.name } : null,
        };
    }

    async update(id: string, dto: { title?: string; content?: string; isPublished?: boolean }) {
        const announcement = await this.announcementRepo.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }

        await this.announcementRepo.update(id, dto);
        return this.findOne(id);
    }

    async delete(id: string) {
        const announcement = await this.announcementRepo.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }

        await this.announcementRepo.delete(id);
        return { success: true };
    }
}
