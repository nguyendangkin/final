import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

@Controller('stats')
export class StatsController {
  constructor(
    private statsService: StatsService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Req() req) {
    // Check if user is admin
    const userId = req.user.id;
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !user.isAdmin) {
      throw new NotFoundException('Unauthorized');
    }

    return this.statsService.getStats();
  }
}
