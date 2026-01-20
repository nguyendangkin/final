import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/user.entity';
import { Car } from '../cars/entities/car.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Car)
    private carsRepository: Repository<Car>,
  ) {}

  async toggleFavorite(
    user: User,
    carId: string,
  ): Promise<{ isFavorited: boolean }> {
    const car = await this.carsRepository.findOne({ where: { id: carId } });
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { user: { id: user.id }, car: { id: carId } },
    });

    if (existingFavorite) {
      await this.favoritesRepository.remove(existingFavorite);
      return { isFavorited: false };
    } else {
      const newFavorite = this.favoritesRepository.create({
        user,
        car,
      });
      await this.favoritesRepository.save(newFavorite);
      return { isFavorited: true };
    }
  }

  async getFavorites(
    user: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<Favorite[]> {
    const skip = (page - 1) * limit;
    return this.favoritesRepository.find({
      where: { user: { id: user.id } },
      relations: ['car', 'car.seller'], // Include car and seller details for display
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  async checkIsFavorited(user: User, carId: string): Promise<boolean> {
    const count = await this.favoritesRepository.count({
      where: { user: { id: user.id }, car: { id: carId } },
    });
    return count > 0;
  }
}
