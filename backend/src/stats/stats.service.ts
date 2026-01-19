import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Car, CarStatus } from '../cars/entities/car.entity';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Car)
        private carsRepository: Repository<Car>,
    ) { }

    async getStats() {
        // User Stats
        const totalUsers = await this.usersRepository.count();
        const bannedUsers = await this.usersRepository.count({ where: { isSellingBanned: true } });

        const sellersResult = await this.carsRepository
            .createQueryBuilder('car')
            .select('COUNT(DISTINCT car.sellerId)', 'count')
            .getRawOne();
        const sellersCount = parseInt(sellersResult.count, 10) || 0;

        const nonSellers = totalUsers - sellersCount;

        // Car Stats
        const totalPosts = await this.carsRepository.count();
        const hiddenPosts = await this.carsRepository.count({ where: { status: CarStatus.HIDDEN } });

        return {
            users: {
                total: totalUsers,
                sellers: sellersCount,
                nonSellers: nonSellers,
                banned: bannedUsers
            },
            cars: {
                total: totalPosts,
                hidden: hiddenPosts,
                available: totalPosts - hiddenPosts // rough estimate as sold is also a status, but request specifically asked for hidden
            }
        };
    }
}
