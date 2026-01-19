import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

import { CarsService } from '../cars/cars.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        public usersRepository: Repository<User>,
        @Inject(forwardRef(() => CarsService))
        private carsService: CarsService,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const newUser = this.usersRepository.create(userData);
        return this.usersRepository.save(newUser);
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async searchByEmail(email: string): Promise<User[]> {
        return this.usersRepository
            .createQueryBuilder('user')
            .where('LOWER(user.email) LIKE LOWER(:email)', { email: `%${email}%` })
            .orderBy('user.createdAt', 'DESC')
            .take(20)
            .getMany();
    }

    async findOneWithCars(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
            relations: ['carsForSale'],
        });
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: User[], total: number, page: number, limit: number, totalPages: number }> {
        const [data, total] = await this.usersRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async toggleBan(id: string): Promise<User> {
        const user = await this.findOne(id);
        if (!user) {
            throw new Error('User not found');
        }

        user.isSellingBanned = !user.isSellingBanned;

        // If banning, delete all cars
        if (user.isSellingBanned) {
            await this.carsService.deleteAllBySeller(id);
        }

        return this.usersRepository.save(user);
    }

    async banUser(id: string): Promise<void> {
        const user = await this.findOne(id);
        if (user && !user.isSellingBanned) {
            user.isSellingBanned = true;
            await this.usersRepository.save(user);
            await this.carsService.deleteAllBySeller(id);
        }
    }
}
