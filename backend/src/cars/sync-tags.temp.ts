
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TagsService } from '../tags/tags.service';
import { CarsService } from './cars.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const carsService = app.get(CarsService);
    const carsRepository = app.get('CarRepository'); // Repository injection via string if needed or get from DataSource

    console.log('Starting sync of year tags...');

    // Actually easier to just use the Repository from app instance
    const repo = app.get('CarRepository') as Repository<Car>;
    const tagsService = app.get(TagsService);

    const cars = await repo.find();
    console.log(`Found ${cars.length} cars. Syncing years...`);

    for (const car of cars) {
        if (car.year) {
            await tagsService.syncTagsFromCar(car, true);
        }
    }

    console.log('Sync complete!');
    await app.close();
}

bootstrap();
