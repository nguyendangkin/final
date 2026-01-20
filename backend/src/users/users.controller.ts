import { Controller, Get, Req, UseGuards, Param, ParseUUIDPipe, NotFoundException, Patch, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Req() req) {
        // req.user is populated by JwtStrategy
        // We might want to fetch fresh data from DB to get latest balance
        const user = await this.usersService.findOne(req.user.id);
        return user;
    }

    @Get('search/email')
    @UseGuards(AuthGuard('jwt'))
    async searchByEmail(@Req() req, @Query('q') query: string) {
        const user = await this.usersService.findOne(req.user.id);
        if (!user || !user.isAdmin) {
            throw new NotFoundException('Unauthorized');
        }
        if (!query || query.trim().length === 0) {
            return [];
        }
        return this.usersService.searchByEmail(query.trim());
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async findAll(@Req() req, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        const user = await this.usersService.findOne(req.user.id);
        if (!user || !user.isAdmin) {
            throw new NotFoundException('Unauthorized');
        }
        return this.usersService.findAll(page, limit);
    }

    @Patch(':id/ban')
    @UseGuards(AuthGuard('jwt'))
    async toggleBan(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        // Check if requester is admin
        const requestingUser = await this.usersService.findOne(req.user.id);
        if (!requestingUser || !requestingUser.isAdmin) {
            throw new NotFoundException('Unauthorized');
        }

        return this.usersService.toggleBan(id);
    }

    @Get(':id/profile')
    async getSellerProfile(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get stats only, avoiding heavy car loading
        const stats = await this.usersService.getSellerStats(id);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
            isSellingBanned: user.isSellingBanned,
            stats: {
                selling: stats.selling,
                sold: stats.sold
            },
            // We do NOT return carsForSale anymore. Frontend will fetch via /cars?sellerId=...
        };
    }
}
