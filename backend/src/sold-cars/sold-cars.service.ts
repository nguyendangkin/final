import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoldCar } from './entities/sold-car.entity';
import { User } from '../users/user.entity';
import { Car } from '../cars/entities/car.entity';

@Injectable()
export class SoldCarsService {
    constructor(
        @InjectRepository(SoldCar)
        private soldCarsRepository: Repository<SoldCar>,
    ) { }

    async create(car: Car): Promise<SoldCar> {
        const soldCar = this.soldCarsRepository.create({
            originalCarId: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            thumbnail: car.thumbnail,
            seller: car.seller,
            // soldAt will be auto-generated
        });
        return this.soldCarsRepository.save(soldCar);
    }

    async findAllBySeller(sellerId: string): Promise<SoldCar[]> {
        return this.soldCarsRepository.find({
            where: { seller: { id: sellerId } },
            order: { soldAt: 'DESC' },
        });
    }
}
