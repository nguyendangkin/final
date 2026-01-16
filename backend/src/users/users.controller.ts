import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
