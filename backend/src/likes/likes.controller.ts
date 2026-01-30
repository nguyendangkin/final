import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard, CurrentUser } from '../common';
import { User } from '../users/entities/user.entity';

@Controller('locations')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') locationId: string, @CurrentUser() user: User) {
    return this.likesService.like(user.id, locationId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlike(@Param('id') locationId: string, @CurrentUser() user: User) {
    return this.likesService.unlike(user.id, locationId);
  }

  @Get(':id/like/count')
  countLikes(@Param('id') locationId: string) {
    return this.likesService.countByLocation(locationId);
  }

  @Get(':id/like/check')
  @UseGuards(JwtAuthGuard)
  checkLiked(@Param('id') locationId: string, @CurrentUser() user: User) {
    return this.likesService.isLiked(user.id, locationId);
  }
}
