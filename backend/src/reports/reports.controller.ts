import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    @Post()
    create(@Body() createReportDto: CreateReportDto, @Req() req) {
        return this.reportsService.create(createReportDto, req.user);
    }

    @Get()
    async findAll(@Query() query: any, @Req() req) {
        const user = await this.usersRepository.findOne({ where: { id: req.user.id } });
        if (!user || !user.isAdmin) {
            throw new ForbiddenException('Only admin can view reports');
        }
        return this.reportsService.findAll(query);
    }

    @Patch(':id/ignore')
    async ignore(@Param('id') id: string, @Req() req) {
        const user = await this.usersRepository.findOne({ where: { id: req.user.id } });
        if (!user || !user.isAdmin) {
            throw new ForbiddenException('Only admin can manage reports');
        }
        return this.reportsService.ignore(id);
    }

    @Patch(':id/resolve')
    async resolve(@Param('id') id: string, @Req() req) {
        const user = await this.usersRepository.findOne({ where: { id: req.user.id } });
        if (!user || !user.isAdmin) {
            throw new ForbiddenException('Only admin can manage reports');
        }
        return this.reportsService.resolve(id);
    }
}
