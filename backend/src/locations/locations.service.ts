import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterLocationDto } from './dto/filter-location.dto';

interface LocationRawResult {
  likeCount: string;
}

interface LikedLocationRaw {
  like_locationId: string;
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(
    userId: string,
    createLocationDto: CreateLocationDto,
    imagePath?: string,
  ): Promise<Location> {
    const location = this.locationRepository.create({
      ...createLocationDto,
      userId,
      image: imagePath,
    });
    return this.locationRepository.save(location);
  }

  async findAll(userId: string, filterDto: FilterLocationDto) {
    const { search, categoryId, page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoin('likes', 'like', 'like.locationId = location.id')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('location.userId = :userId', { userId })
      .groupBy('location.id')
      .addGroupBy('category.id')
      .addGroupBy('parentCategory.id')
      .orderBy('location.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(location.name ILIKE :search OR location.note ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      // Hierarchical filter: match direct categoryId OR child categories (where parent = categoryId)
      queryBuilder.andWhere(
        '(location.categoryId = :categoryId OR category.parentId = :categoryId)',
        { categoryId },
      );
    }

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const rawResults = raw as LocationRawResult[];

    const locations = entities.map((entity, index) => ({
      ...entity,
      likeCount: parseInt(rawResults[index]?.likeCount || '0', 10),
    }));

    const total = await this.locationRepository.count({
      where: { userId },
    });

    return {
      data: locations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublic(userId?: string, filterDto?: FilterLocationDto) {
    const { page = 1, limit = 20 } = filterDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.category', 'category')
      .leftJoinAndSelect('location.user', 'user')
      .leftJoin('likes', 'like', 'like.locationId = location.id')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('location.isPublic = :isPublic', { isPublic: true })
      .groupBy('location.id')
      .addGroupBy('category.id')
      .addGroupBy('user.id')
      .orderBy('location.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const rawResults = raw as LocationRawResult[];

    // Check if current user liked each location
    let likedLocationIds: string[] = [];
    if (userId) {
      const likedLocations: LikedLocationRaw[] =
        await this.locationRepository.manager
          .createQueryBuilder()
          .select('like.locationId')
          .from('likes', 'like')
          .where('like.userId = :userId', { userId })
          .andWhere('like.locationId IN (:...locationIds)', {
            locationIds:
              entities.map((e) => e.id).length > 0
                ? entities.map((e) => e.id)
                : ['00000000-0000-0000-0000-000000000000'],
          })
          .getRawMany();
      likedLocationIds = likedLocations.map((l) => l.like_locationId);
    }

    const locations = entities.map((entity, index) => ({
      ...entity,
      likeCount: parseInt(rawResults[index]?.likeCount || '0', 10),
      isLiked: likedLocationIds.includes(entity.id),
    }));

    const total = await this.locationRepository.count({
      where: { isPublic: true },
    });

    return {
      data: locations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(
    targetUserId: string,
    currentUserId?: string,
    filterDto?: FilterLocationDto,
  ) {
    const { page = 1, limit = 20 } = filterDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoin('likes', 'like', 'like.locationId = location.id')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('location.userId = :targetUserId', { targetUserId })
      .andWhere('location.isPublic = :isPublic', { isPublic: true })
      .groupBy('location.id')
      .addGroupBy('category.id')
      .addGroupBy('parentCategory.id')
      .orderBy('location.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const rawResults = raw as LocationRawResult[];

    let likedLocationIds: string[] = [];
    if (currentUserId) {
      const likedLocations: LikedLocationRaw[] =
        await this.locationRepository.manager
          .createQueryBuilder()
          .select('like.locationId')
          .from('likes', 'like')
          .where('like.userId = :currentUserId', { currentUserId })
          .andWhere('like.locationId IN (:...locationIds)', {
            locationIds:
              entities.map((e) => e.id).length > 0
                ? entities.map((e) => e.id)
                : ['00000000-0000-0000-0000-000000000000'],
          })
          .getRawMany();
      likedLocationIds = likedLocations.map((l) => l.like_locationId);
    }

    const locations = entities.map((entity, index) => ({
      ...entity,
      likeCount: parseInt(rawResults[index]?.likeCount || '0', 10),
      isLiked: likedLocationIds.includes(entity.id),
    }));

    const total = await this.locationRepository.count({
      where: { userId: targetUserId, isPublic: true },
    });

    return {
      data: locations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string): Promise<Location> {
    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('location.user', 'user')
      .leftJoin('likes', 'like', 'like.locationId = location.id')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('location.id = :id', { id })
      .groupBy('location.id')
      .addGroupBy('category.id')
      .addGroupBy('parentCategory.id')
      .addGroupBy('user.id');

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const rawResults = raw as LocationRawResult[];
    if (!entities[0]) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    const location = entities[0];
    location.likeCount = parseInt(rawResults[0]?.likeCount || '0', 10);

    // Check if current user liked
    if (userId) {
      const liked: { like_id: string } | undefined =
        await this.locationRepository.manager
          .createQueryBuilder()
          .select('like.id')
          .from('likes', 'like')
          .where('like.userId = :userId', { userId })
          .andWhere('like.locationId = :locationId', { locationId: id })
          .getRawOne();
      location.isLiked = !!liked;
    }

    return location;
  }

  async update(
    id: string,
    userId: string,
    updateLocationDto: UpdateLocationDto,
    imagePath?: string,
  ): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, userId },
    });
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    Object.assign(location, updateLocationDto);
    if (imagePath) {
      location.image = imagePath;
    }

    return this.locationRepository.save(location);
  }

  async togglePublic(id: string, userId: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, userId },
    });
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    location.isPublic = !location.isPublic;
    return this.locationRepository.save(location);
  }

  async remove(id: string, userId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id, userId },
    });
    if (!location) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }
    await this.locationRepository.remove(location);
  }
}
