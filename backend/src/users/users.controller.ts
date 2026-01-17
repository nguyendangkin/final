import { Controller, Get, Req, UseGuards, Param, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
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

    @Get(':id/profile')
    async getSellerProfile(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.usersService.findOneWithCars(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // Filter only available cars and sort by newest first
        const availableCars = user.carsForSale
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
