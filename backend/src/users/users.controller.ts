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

        const userToBan = await this.usersService.findOne(id);
        if (!userToBan) {
            throw new NotFoundException('User not found');
        }

        userToBan.isSellingBanned = !userToBan.isSellingBanned;
        return this.usersService.usersRepository.save(userToBan);
    }

    @Get(':id/profile')
    async getSellerProfile(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.usersService.findOneWithCars(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // Filter only available cars and sort by newest first
        // Filter only available cars and sort by newest first
        // Filter only available cars and sort by newest first
        // If user is banned, hide all cars
        // Also exclude HIDDEN cars
        const availableCars = (user.isSellingBanned ? [] : user.carsForSale)
            ?.filter(car => car.status !== 'HIDDEN')
            //.filter(car => car.status === 'AVAILABLE') // Removed to show sold cars
            ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
            carsForSale: availableCars,
        };
    }
}
