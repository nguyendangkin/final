import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldCar } from './entities/sold-car.entity';
import { SoldCarsService } from './sold-cars.service';
import { SoldCarsController } from './sold-cars.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SoldCar])],
    controllers: [SoldCarsController],
    providers: [SoldCarsService],
    exports: [SoldCarsService], // Export service to be used in CarsService
})
export class SoldCarsModule { }
