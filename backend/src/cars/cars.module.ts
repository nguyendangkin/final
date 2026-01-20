import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { Car } from './entities/car.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TagsModule } from '../tags/tags.module';
import { SoldCarsModule } from '../sold-cars/sold-cars.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Car]),
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
        NotificationsModule,
        TagsModule,
        SoldCarsModule,
    ],
    controllers: [CarsController],
    providers: [CarsService],
    exports: [CarsService],
})
export class CarsModule { }
