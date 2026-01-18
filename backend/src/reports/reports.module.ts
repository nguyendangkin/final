import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { User } from '../users/user.entity';
import { CarsModule } from '../cars/cars.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Report, User]),
        CarsModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
