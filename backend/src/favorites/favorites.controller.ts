import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('toggle/:carId')
  async toggleFavorite(@Request() req, @Param('carId') carId: string) {
    return this.favoritesService.toggleFavorite(req.user, carId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getFavorites(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.favoritesService.getFavorites(
      req.user,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('check/:carId')
  async checkIsFavorited(@Request() req, @Param('carId') carId: string) {
    const isFavorited = await this.favoritesService.checkIsFavorited(
      req.user,
      carId,
    );
    return { isFavorited };
  }
}
