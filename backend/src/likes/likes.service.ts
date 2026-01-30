import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async like(userId: string, locationId: string): Promise<Like> {
    // Check if location exists and is public
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }
    if (!location.isPublic) {
      throw new BadRequestException('Chỉ có thể thích địa điểm công khai');
    }

    // Check if already liked
    const existingLike = await this.likeRepository.findOne({
      where: { userId, locationId },
    });
    if (existingLike) {
      return existingLike;
    }

    const like = this.likeRepository.create({ userId, locationId });
    return this.likeRepository.save(like);
  }

  async unlike(userId: string, locationId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { userId, locationId },
    });
    if (like) {
      await this.likeRepository.remove(like);
    }
  }

  async countByLocation(locationId: string): Promise<number> {
    return this.likeRepository.count({ where: { locationId } });
  }

  async isLiked(userId: string, locationId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { userId, locationId },
    });
    return !!like;
  }

  async getLikedLocationIds(userId: string): Promise<string[]> {
    const likes = await this.likeRepository.find({
      where: { userId },
      select: ['locationId'],
    });
    return likes.map((l) => l.locationId);
  }
}
