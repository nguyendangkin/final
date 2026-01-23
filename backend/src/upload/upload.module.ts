import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Car } from '../cars/entities/car.entity';
import { SoldCar } from '../sold-cars/entities/sold-car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car, SoldCar])],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }
