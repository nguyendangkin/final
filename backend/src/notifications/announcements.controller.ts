import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/announcements')
@UseGuards(AuthGuard('jwt'))
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    private checkAdmin(user: any) {
        if (!user.isAdmin) {
            throw new ForbiddenException('Admin access required');
        }
    }

    @Post()
    async create(
        @Request() req,
        @Body() dto: { title: string; content: string },
    ) {
        this.checkAdmin(req.user);
        return this.announcementsService.create(req.user.id, dto);
    }

    @Get()
    async findAll(
        @Request() req,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        this.checkAdmin(req.user);
        return this.announcementsService.findAll(parseInt(page) || 1, parseInt(limit) || 10);
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req.user);
        return this.announcementsService.findOne(id);
    }

    @Put(':id')
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: { title?: string; content?: string; isPublished?: boolean },
    ) {
        this.checkAdmin(req.user);
        return this.announcementsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req.user);
        return this.announcementsService.delete(id);
    }
}
