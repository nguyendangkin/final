import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Car, CarStatus } from './entities/car.entity';
import { CreateCarDto, UpdateCarDto } from './dto/create-car.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CarsService {
    constructor(
        @InjectRepository(Car)
        private carsRepository: Repository<Car>,
        private dataSource: DataSource,
    ) { }

    async findAll(query: any): Promise<Car[]> {
        const qb = this.carsRepository.createQueryBuilder('car');
        qb.leftJoinAndSelect('car.seller', 'seller');
        // qb.where('car.status = :status', { status: CarStatus.AVAILABLE }); // Removed to show sold cars

        if (query.make) {
            qb.andWhere('car.make ILIKE :make', { make: `%${query.make}%` });
        }
        if (query.model) {
            qb.andWhere('car.model ILIKE :model', { model: `%${query.model}%` });
        }
        if (query.minPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) >= :minPrice', { minPrice: query.minPrice });
        }
        if (query.maxPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) <= :maxPrice', { maxPrice: query.maxPrice });
        }
        if (query.sellerId) {
            qb.andWhere('seller.id = :sellerId', { sellerId: query.sellerId });
        }

        // Sắp xếp bài mới nhất lên trên
        qb.orderBy('car.createdAt', 'DESC');

        // Pagination
        const page = query.page ? parseInt(query.page) : 1;
        const limit = query.limit ? parseInt(query.limit) : 12;
        const skip = (page - 1) * limit;

        qb.take(limit);
        qb.skip(skip);

        return qb.getMany();
    }

    async findOne(id: string): Promise<Car> {
        const car = await this.carsRepository.findOne({
            where: { id },
            relations: ['seller'],
        });
        if (!car) throw new NotFoundException('Car not found');
        return car;
    }

    async create(createCarDto: CreateCarDto, seller: User): Promise<Car> {
        const car = this.carsRepository.create({
            ...createCarDto,
            seller,
            price: createCarDto.price.toString(),
        });
        return this.carsRepository.save(car);
    }

    async update(id: string, updateCarDto: UpdateCarDto, user: User): Promise<Car> {
        const car = await this.findOne(id);
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only update your own listings');
        }

        // Handle price conversion if it's in the DTO
        const updates: any = { ...updateCarDto };
        if (updates.price) {
            updates.price = updates.price.toString();
        }

        // Track edit history
        const editTimestamp = new Date().toISOString();
        if (!car.editHistory || car.editHistory.length === 0) {
            car.editHistory = [editTimestamp];
        } else {
            car.editHistory = [...car.editHistory, editTimestamp];
        }

        Object.assign(car, updates);
        return this.carsRepository.save(car);
    }

    async remove(id: string, user: User): Promise<void> {
        const car = await this.findOne(id);
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only delete your own listings');
        }
        await this.carsRepository.remove(car);
    }

    async buy(id: string, buyerId: string): Promise<Car> {
        return this.dataSource.transaction(async (manager) => {
            const car = await manager.findOne(Car, { where: { id }, relations: ['seller'] });
            if (!car) throw new NotFoundException('Car not found');
            if (car.status !== CarStatus.AVAILABLE) throw new BadRequestException('Car is not available');
            if (car.seller.id === buyerId) throw new BadRequestException('Cannot buy your own car');

            const buyer = await manager.findOne(User, { where: { id: buyerId } });
            if (!buyer) throw new NotFoundException('Buyer not found');

            const price = BigInt(car.price);
            const buyerBalance = BigInt(buyer.balance);

            if (buyerBalance < price) {
                throw new BadRequestException('Insufficient balance');
            }

            const seller = await manager.findOne(User, { where: { id: car.seller.id } });
            if (!seller) throw new NotFoundException('Seller not found');

            buyer.balance = (buyerBalance - price).toString();
            const sellerBalance = BigInt(seller.balance);
            seller.balance = (sellerBalance + price).toString();

            car.status = CarStatus.SOLD;

            await manager.save(buyer);
            await manager.save(seller);
            return await manager.save(car);
        });
    }
}
