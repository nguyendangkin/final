import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { PaymentModule } from './payment/payment.module';
import { Transaction } from './payment/transaction.entity';
import { CarsModule } from './cars/cars.module';
import { Car } from './cars/entities/car.entity';
import { CarView } from './cars/entities/car-view.entity';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ReportsModule } from './reports/reports.module';
import { Report } from './reports/entities/report.entity';
import { StatsModule } from './stats/stats.module';
import { FavoritesModule } from './favorites/favorites.module';
import { Favorite } from './favorites/entities/favorite.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { SystemAnnouncement } from './notifications/entities/system-announcement.entity';
import { UserAnnouncementRead } from './notifications/entities/user-announcement-read.entity';
import { TagsModule } from './tags/tags.module';
import { Tag } from './tags/entities/tag.entity';
import { SoldCarsModule } from './sold-cars/sold-cars.module';
import { SoldCar } from './sold-cars/entities/sold-car.entity';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute cache
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'admin'),
        database: configService.get<string>('DB_NAME', 'sukasuka_db'),
        entities: [
          User,
          Transaction,
          Car,
          CarView,
          Report,
          Favorite,
          Notification,
          SystemAnnouncement,
          UserAnnouncementRead,
          Tag,
          SoldCar,
        ],
        // synchronize: true, // Auto-create tables (dev only)
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // Only auto-sync in dev
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    PaymentModule,
    CarsModule,
    UploadModule,
    ReportsModule,
    StatsModule,
    FavoritesModule,
    NotificationsModule,
    TagsModule,
    SoldCarsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
