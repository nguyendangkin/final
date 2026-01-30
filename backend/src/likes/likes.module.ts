import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Location } from '../locations/entities/location.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Location])],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
