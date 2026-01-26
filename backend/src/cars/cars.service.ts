import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, In } from 'typeorm';
import { Car, CarStatus } from './entities/car.entity';
import { CarView } from './entities/car-view.entity';
import { CreateCarDto, UpdateCarDto } from './dto/create-car.dto';
import { User } from '../users/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { TagsService } from '../tags/tags.service';
import { SoldCarsService } from '../sold-cars/sold-cars.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectRepository(Car)
    private carsRepository: Repository<Car>,
    @InjectRepository(CarView)
    private carViewRepository: Repository<CarView>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private tagsService: TagsService,
    private soldCarsService: SoldCarsService,
    private uploadService: UploadService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * Cache Strategy Documentation:
   *
   * This service uses in-memory caching via @nestjs/cache-manager.
   * Cache is automatically applied at the controller level via CacheInterceptor.
   *
   * Cache invalidation strategy:
   * - clearCache(carId?) is called after any mutation (create, update, delete)
   * - Individual car cache is cleared by key `/cars/{id}`
   * - List caches rely on TTL expiration (typically 60s) since glob deletion
   *   is not easily supported by the default in-memory store
   *
   * For production with high traffic, consider:
   * - Using Redis with cache-manager-redis-store for more control
   * - Implementing cache tags/prefixes for bulk invalidation
   * - Adding cache warming for popular listings
   */
  private async clearCache(carId?: string) {
    try {
      if (carId) {
        await this.cacheManager.del(`/cars/${carId}`);
      }
      // List caches rely on TTL expiration since we can't easily do glob deletion
      // with the default in-memory cache. For Redis, consider using patterns/tags.
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }

  async getSellerStats(
    sellerId: string,
  ): Promise<{ selling: number; sold: number }> {
    const selling = await this.carsRepository.count({
      where: { seller: { id: sellerId }, status: CarStatus.AVAILABLE },
    });
    const sold = await this.soldCarsService.countBySeller(sellerId);
    return { selling, sold };
  }

  /**
   * Delete image files associated with a car from the uploads folder
   */
  /**
   * Delete image files associated with a car from the uploads folder
   */
  private async deleteCarImages(car: Car): Promise<void> {
    const urls = [...(car.images || [])];
    if (car.thumbnail) urls.push(car.thumbnail);
    if (urls.length > 0) {
      await this.uploadService.deleteFiles(urls);
    }
  }

  async findAll(query: any): Promise<{ data: Car[]; meta: any }> {
    const qb = this.carsRepository.createQueryBuilder('car');

    // Select only necessary fields for listing to reduce payload size
    qb.select([
      'car.id',
      'car.make',
      'car.model',
      'car.year',
      'car.trim',
      'car.price',
      'car.mileage',
      'car.location',
      'car.thumbnail',
      'car.images',
      'car.status',
      'car.createdAt',
      'car.views',
      'car.isNegotiable',
      'car.condition',
      'car.paperwork',
      'car.transmission',
      'car.drivetrain',
      'car.registryExpiry',
      'car.noRegistry',
    ]);

    // We also need seller info
    qb.leftJoin('car.seller', 'seller');
    qb.addSelect([
      'seller.id',
      'seller.name',
      'seller.avatar',
      'seller.isSellingBanned',
    ]);

    if (!query.includeHidden) {
      qb.andWhere('car.status IN (:...publicStatuses)', {
        publicStatuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
      });
    }

    // Hide cars from banned sellers
    qb.andWhere('seller.isSellingBanned = :isBanned', { isBanned: false });

    if (query.make) {
      qb.andWhere('car.make ILIKE :make', { make: query.make });
    }
    if (query.model) {
      qb.andWhere('car.model ILIKE :model', { model: query.model });
    }
    if (query.transmission) {
      qb.andWhere('car.transmission ILIKE :transmission', {
        transmission: query.transmission,
      });
    }
    if (query.drivetrain) {
      qb.andWhere('car.drivetrain ILIKE :drivetrain', {
        drivetrain: query.drivetrain,
      });
    }
    if (query.condition) {
      qb.andWhere('car.condition ILIKE :condition', {
        condition: query.condition,
      });
    }
    if (query.paperwork) {
      qb.andWhere('car.paperwork ILIKE :paperwork', {
        paperwork: query.paperwork,
      });
    }
    if (query.minPrice) {
      qb.andWhere('car.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice) {
      qb.andWhere('car.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }
    if (query.sellerId) {
      qb.andWhere('seller.id = :sellerId', { sellerId: query.sellerId });
    }
    if (query.location) {
      qb.andWhere('car.location ILIKE :location', {
        location: query.location,
      });
    }
    if (query.chassisCode) {
      qb.andWhere('car.chassisCode ILIKE :chassisCode', {
        chassisCode: query.chassisCode,
      });
    }
    if (query.engineCode) {
      qb.andWhere('car.engineCode ILIKE :engineCode', {
        engineCode: query.engineCode,
      });
    }
    if (query.notableFeatures) {
      qb.andWhere('car.notableFeatures ILIKE :notableFeatures', {
        notableFeatures: query.notableFeatures,
      });
    }
    if (query.trim) {
      qb.andWhere('car.trim ILIKE :trim', { trim: query.trim });
    }
    if (query.year && !query.minYear && !query.maxYear) {
      qb.andWhere('car.year = :year', { year: query.year });
    }
    if (query.mods) {
      // Revert to text-based search for "like other filters" behavior,
      // but wrap in quotes to target JSON values specifically and avoid partial word matches.
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods', {
        mods: `%"${query.mods}"%`,
      });
    }
    if (query.mods_exterior) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_exterior', {
        mods_exterior: `%"${query.mods_exterior}"%`,
      });
    }
    if (query.mods_interior) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_interior', {
        mods_interior: `%"${query.mods_interior}"%`,
      });
    }
    if (query.mods_engine) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_engine', {
        mods_engine: `%"${query.mods_engine}"%`,
      });
    }
    if (query.mods_footwork) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_footwork', {
        mods_footwork: `%"${query.mods_footwork}"%`,
      });
    }

    // Smart full-text search - concatenate all searchable fields into one string
    if (query.q) {
      const searchWords = query.q
        .trim()
        .split(/\s+/)
        .filter((w: string) => w.length > 0);

      // Create a combined searchable column from all relevant fields
      const searchableFields = `CONCAT_WS(' ', 
                COALESCE(car.make, ''), 
                COALESCE(car.model, ''), 
                COALESCE(car.trim, ''), 
                COALESCE(car.chassisCode, ''), 
                COALESCE(car.engineCode, ''), 
                COALESCE(car.transmission, ''),
                COALESCE(car.drivetrain, ''),
                COALESCE(car.condition, ''), 
                COALESCE(car.paperwork, ''), 
                COALESCE(car.description, ''),
                COALESCE(CAST(car.mods AS TEXT), '')
            )`;

      searchWords.forEach((word: string, index: number) => {
        const paramName = `q${index}`;
        qb.andWhere(`${searchableFields} ILIKE :${paramName}`, {
          [paramName]: `%${word}%`,
        });
      });
    }

    if (query.status) {
      qb.andWhere('car.status = :status', { status: query.status });
    }

    // Sorting
    if (!query.status) {
      qb.orderBy('car.status', 'ASC');
      qb.addOrderBy('car.createdAt', 'DESC');
    } else {
      qb.orderBy('car.createdAt', 'DESC');
    }

    // Pagination
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 12;
    const skip = (page - 1) * limit;

    qb.take(limit);
    qb.skip(skip);

    const [cars, total] = await qb.getManyAndCount();

    // Fix images array for frontend because we didn't select it?
    // Frontend uses `car.thumbnail` mostly. But `CarCard` checks `car.images[0]`.
    // If `thumbnail` is missing, it falls back to `images[0]`.
    // Since we are NOT selecting `images`, `cars[i].images` will be undefined.
    // We should ensure `images` is strictly not needed OR select it partially?
    // Actually, `thumbnail` is encouraged. If we want to support fallback, we must select `images`.
    // But `images` is simple-array (text). It's not THAT huge unless 100 images.
    // Let's check `CarCard`: `car.thumbnail || (car.images && car.images.length > 0) ? ...`
    // If we don't select `images`, `car.images` is undefined.
    // So we MUST select `images` IF `thumbnail` can be null.
    // Can we Select `images`? Yes, it's a column.
    // Let's add 'car.images' to selection to be safe, it's just text.
    // But `description` is the big one we want to avoid.

    return {
      data: cars,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userPayload?: any): Promise<Car> {
    const qb = this.carsRepository.createQueryBuilder('car');
    qb.leftJoin('car.seller', 'seller');
    qb.addSelect([
      'seller.id',
      'seller.name',
      'seller.avatar',
      'seller.isSellingBanned',
      'seller.isAdmin',
    ]); // Select only public fields
    qb.where('car.id = :id', { id });

    const car = await qb.getOne();

    if (!car) throw new NotFoundException('Car not found');

    // Check if car is hidden
    if (car.status === CarStatus.HIDDEN) {
      let isAdmin = false;
      // userPayload from JWT strategy has minimal info, usually sub/id.
      // If we selected 'seller.isAdmin' above, that's for the seller of the car, NOT the requesting user.
      // We need to check the requesting user's admin status.
      if (
        userPayload &&
        (userPayload.sub || userPayload.id || userPayload.userId)
      ) {
        const userId = userPayload.sub || userPayload.id || userPayload.userId;
        // Query user role explicitly safely
        const user = await this.dataSource.getRepository(User).findOne({
          where: { id: userId },
          select: ['id', 'isAdmin'],
        });
        if (user && user.isAdmin) {
          isAdmin = true;
        }
      }

      if (!isAdmin) {
        // If the user is the seller, they should see it too?
        // Logic says "HIDDEN" is administrative hide? Or user draft?
        // If user draft is PENDING, HIDDEN might be banned.
        // Let's assume only Admin sees HIDDEN.
        // Wait, if I am the seller, I might want to see my hidden car?
        // Use strict check: userPayload.id === car.seller.id
        if (
          userPayload &&
          (userPayload.sub || userPayload.id) === car.seller.id
        ) {
          // Seller can see own car
        } else {
          throw new NotFoundException('Car not found');
        }
      }
    }

    // Hide car if seller is banned
    if (car.seller && car.seller.isSellingBanned) {
      let isAdmin = false;
      if (userPayload && (userPayload.sub || userPayload.id)) {
        const userId = userPayload.sub || userPayload.id;
        const user = await this.dataSource.getRepository(User).findOne({
          where: { id: userId },
          select: ['id', 'isAdmin'],
        });
        if (user && user.isAdmin) {
          isAdmin = true;
        }
      }

      // Allow seller to see their own banned car? Usually yes so they can appeal.
      if (
        !isAdmin &&
        (!userPayload || (userPayload.sub || userPayload.id) !== car.seller.id)
      ) {
        throw new NotFoundException('Car not found');
      }
    }

    return car;
  }

  async create(createCarDto: CreateCarDto, seller: User): Promise<Car> {
    // Check for duplicate listings from the same seller
    // Criteria: Same make, model, year, price, mileage AND (AVAILABLE or PENDING_APPROVAL)
    const duplicateCar = await this.carsRepository.findOne({
      where: {
        seller: { id: seller.id },
        make: createCarDto.make,
        model: createCarDto.model,
        year: createCarDto.year,
        price: createCarDto.price.toString(),
        mileage: createCarDto.mileage,
        status: In([CarStatus.AVAILABLE, CarStatus.PENDING_APPROVAL]),
      },
      relations: ['seller'],
    });

    if (duplicateCar) {
      throw new BadRequestException(
        'Bạn đã có một bài đăng tương tự cho xe này. Vui lòng kiểm tra lại danh sách xe của bạn.',
      );
    }

    // Move images from temp to permanent storage
    // This must happen BEFORE saving to DB so that the URLs are correct
    let permanentImages: string[] = [];
    let permanentThumbnail: string | undefined = createCarDto.thumbnail;

    try {
      if (createCarDto.images && createCarDto.images.length > 0) {
        permanentImages = await this.uploadService.moveFilesToPermanent(
          createCarDto.images,
        );
        this.logger.log(
          `Moved ${permanentImages.length} images from temp to permanent storage`,
        );
      }

      if (createCarDto.thumbnail) {
        const movedThumbnails = await this.uploadService.moveFilesToPermanent([
          createCarDto.thumbnail,
        ]);
        if (movedThumbnails.length > 0) {
          permanentThumbnail = movedThumbnails[0];
          this.logger.log('Moved thumbnail from temp to permanent storage');
        }
      }

      // Check how many approved posts this user has
      const approvedCount = await this.carsRepository.count({
        where: [
          { seller: { id: seller.id }, status: CarStatus.AVAILABLE },
          { seller: { id: seller.id }, status: CarStatus.SOLD },
        ],
      });

      // First 3 posts must be approved manually
      // If user is admin, skip this check
      const initialStatus =
        seller.isAdmin || approvedCount >= 3
          ? CarStatus.AVAILABLE
          : CarStatus.PENDING_APPROVAL;

      const car = this.carsRepository.create({
        ...createCarDto,
        images: permanentImages,
        thumbnail: permanentThumbnail,
        seller,
        price: createCarDto.price.toString(),
        status: initialStatus,
      });

      this.logger.log(
        `Creating car with notableFeatures: ${JSON.stringify(createCarDto.notableFeatures)}`,
      );

      const savedCar = await this.carsRepository.save(car);

      // Sync tags to Tag table (increment usageCount)
      await this.tagsService.syncTagsFromCar(savedCar, true);

      await this.clearCache();

      return savedCar;
    } catch (error) {
      // CLEANUP: If something went wrong after moving files, delete them to avoid orphans
      const filesToCleanup = [...permanentImages];
      if (permanentThumbnail) filesToCleanup.push(permanentThumbnail);

      if (filesToCleanup.length > 0) {
        this.logger.warn(
          `Cleanup: Deleting ${filesToCleanup.length} files due to create failure: ${error.message}`,
        );
        await this.uploadService.deleteFiles(filesToCleanup);
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateCarDto: UpdateCarDto,
    user: User,
  ): Promise<Car> {
    const car = await this.findOne(id);
    if (car.seller.id !== user.id) {
      throw new BadRequestException('You can only update your own listings');
    }

    // Track old images for cleanup
    const oldImages = [...(car.images || [])];
    const oldThumbnail = car.thumbnail;

    // Sync tags: Remove old tags usage
    // We do this BEFORE updating the car object so we have the old values
    await this.tagsService.syncTagsFromCar(car, false);

    // Handle price conversion if it's in the DTO
    const updates: any = { ...updateCarDto };
    if (updates.price) {
      updates.price = updates.price.toString();
    }

    const movedImages: string[] = [];

    try {
      // Handle Image Updates: Move new images from temp to permanent
      if (updates.images && Array.isArray(updates.images)) {
        updates.images = await this.uploadService.moveFilesToPermanent(
          updates.images,
        );
        movedImages.push(...updates.images);
      }
      if (updates.thumbnail) {
        const moved = await this.uploadService.moveFilesToPermanent([
          updates.thumbnail,
        ]);
        if (moved.length > 0) {
          updates.thumbnail = moved[0];
          movedImages.push(...moved);
        }
      }

      // Track edit history (limit to 100 entries to prevent unbounded growth)
      const editTimestamp = new Date().toISOString();
      const MAX_EDIT_HISTORY = 100;
      if (!car.editHistory || car.editHistory.length === 0) {
        car.editHistory = [editTimestamp];
      } else {
        const newHistory = [...car.editHistory, editTimestamp];
        // Keep only the most recent entries if exceeding limit
        car.editHistory = newHistory.slice(-MAX_EDIT_HISTORY);
      }

      Object.assign(car, updates);

      this.logger.log(
        `Updating car ${id} with notableFeatures: ${JSON.stringify(updates.notableFeatures)}`,
      );

      const updatedCar = await this.carsRepository.save(car);

      // CLEANUP: Delete old images that are no longer referenced
      const currentImages = updatedCar.images || [];
      const currentThumbnail = updatedCar.thumbnail;

      // Robust comparison: compare only filenames to avoid full URL vs relative path mismatches
      const getCurrentFilenames = (urls: string[]) =>
        urls
          .map((url) => {
            try {
              return path.basename(url);
            } catch (e) {
              return url;
            }
          })
          .filter(Boolean);

      const currentFilenames = getCurrentFilenames([
        ...currentImages,
        ...(currentThumbnail ? [currentThumbnail] : []),
      ]);

      const imagesToRemove = oldImages.filter((oldImg) => {
        if (!oldImg) return false;
        const oldFilename = path.basename(oldImg);
        return !currentFilenames.includes(oldFilename);
      });

      if (
        oldThumbnail &&
        !currentFilenames.includes(path.basename(oldThumbnail))
      ) {
        imagesToRemove.push(oldThumbnail);
      }

      // Filter duplicates in imagesToRemove
      const uniqueImagesToRemove = Array.from(new Set(imagesToRemove));

      if (uniqueImagesToRemove.length > 0) {
        this.logger.log(
          `Cleanup: Deleting ${uniqueImagesToRemove.length} replaced images for car ${id}`,
        );
        await this.uploadService.deleteFiles(uniqueImagesToRemove);
      }

      // Sync tags: Add new tags usage
      // We do this AFTER saving so we have stored the new values (and validation passed)
      await this.tagsService.syncTagsFromCar(updatedCar, true);

      await this.clearCache(id);

      return updatedCar;
    } catch (error) {
      if (movedImages.length > 0) {
        this.logger.warn(
          `Cleanup: Deleting ${movedImages.length} newly moved images due to update failure`,
        );
        await this.uploadService.deleteFiles(movedImages);
      }
      throw error;
    }
  }

  async remove(id: string, user: User): Promise<void> {
    const car = await this.findOne(id);

    // Allow if user is admin OR if user is the seller
    if (!user.isAdmin && car.seller.id !== user.id) {
      throw new BadRequestException('You can only delete your own listings');
    }

    // Delete associated images from disk (including thumbnail)
    await this.deleteCarImages(car);

    // Send notification if deletion is by Admin and not self
    if (user.isAdmin && car.seller.id !== user.id) {
      await this.notificationsService.createNotification(
        car.seller.id,
        NotificationType.POST_DELETED,
        'Bài đăng bị xóa',
        `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã bị quản trị viên xóa do vi phạm quy định.`,
      );
    }

    // Decrement tag usage counts before removing car
    await this.tagsService.syncTagsFromCar(car, false);

    await this.carsRepository.remove(car);
    await this.clearCache(id);
  }

  async markAsSold(id: string, user: User): Promise<void> {
    const car = await this.findOne(id);

    // Verify ownership
    if (car.seller.id !== user.id) {
      throw new BadRequestException(
        'You can only mark your own listings as sold',
      );
    }

    // Create record in SoldCar table before deleting
    await this.soldCarsService.create(car);

    // Per user request: Delete completely (including all images) instead of archiving
    await this.remove(id, user);
  }

  async deleteAllBySeller(sellerId: string): Promise<void> {
    // Find all cars by seller to delete their images
    const cars = await this.carsRepository.find({
      where: { seller: { id: sellerId } },
    });

    // Delete images and decrement tags for each car
    for (const car of cars) {
      await this.deleteCarImages(car);
      await this.tagsService.syncTagsFromCar(car, false);
    }

    await this.carsRepository.delete({ seller: { id: sellerId } });
  }

  async forceDelete(id: string): Promise<void> {
    const car = await this.carsRepository.findOne({ where: { id } });
    if (!car) throw new NotFoundException('Car not found');

    // Delete associated images from disk
    await this.deleteCarImages(car);

    // Decrement tag usage counts
    await this.tagsService.syncTagsFromCar(car, false);

    await this.carsRepository.remove(car);
  }


  async getPendingCars(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Car[]; meta: any }> {
    const [cars, total] = await this.carsRepository.findAndCount({
      where: { status: CarStatus.PENDING_APPROVAL },
      relations: ['seller'],
      order: { createdAt: 'ASC' }, // FIFO: Oldest first
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: cars,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveCar(id: string): Promise<Car> {
    const car = await this.findOne(id); // Helper ensuring it exists, but might throw if hidden/pending for non-admin?
    // Actually findOne filters out hidden cars for non-admins, but we expect admin to call this.
    // We'll trust the controller to be guarded or we use repository directly.

    car.status = CarStatus.AVAILABLE;
    await this.carsRepository.save(car);
    await this.clearCache(id);

    // Notify user
    await this.notificationsService.createNotification(
      car.seller.id,
      NotificationType.POST_APPROVED,
      'Bài đăng được duyệt',
      `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã được phê duyệt và hiển thị công khai.`,
    );

    return car;
  }

  async rejectCar(id: string): Promise<void> {
    const car = await this.findOne(id);

    // Notify user before deletion (so we still have the car data)
    await this.notificationsService.createNotification(
      car.seller.id,
      NotificationType.POST_REJECTED,
      'Bài đăng bị từ chối',
      `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã bị từ chối và xóa khỏi hệ thống. Vui lòng kiểm tra lại quy định đăng tin.`,
    );

    // Delete associated images from disk
    await this.deleteCarImages(car);

    // Decrement tag usage counts
    await this.tagsService.syncTagsFromCar(car, false);

    // Remove from DB
    await this.carsRepository.remove(car);
    await this.clearCache(id);
  }

  async getBrands(): Promise<string[]> {
    const brands = await this.carsRepository
      .createQueryBuilder('car')
      .leftJoin('car.seller', 'seller')
      .select('DISTINCT car.make', 'make')
      .where('car.status IN (:...statuses)', {
        statuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
      })
      .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
      .getRawMany();

    return brands.map((b) => b.make).filter(Boolean);
  }

  async getFiltersByBrand(make: string): Promise<any> {
    const [
      model,
      chassisCode,
      engineCode,
      transmission,
      drivetrain,
      condition,
      paperwork,
      year,
      location,
      mods_exterior,
      mods_interior,
      mods_engine,
      mods_footwork,
      notableFeatures,
    ] = await Promise.all([
      this.tagsService.getSuggestions('model', make),
      this.tagsService.getSuggestions('chassisCode'),
      this.tagsService.getSuggestions('engineCode'),
      this.tagsService.getSuggestions('transmission'),
      this.tagsService.getSuggestions('drivetrain'),
      this.tagsService.getSuggestions('condition'),
      this.tagsService.getSuggestions('paperwork'),
      this.tagsService.getSuggestions('year'),
      this.tagsService.getSuggestions('location'),
      this.tagsService.getSuggestions('mods_exterior'),
      this.tagsService.getSuggestions('mods_interior'),
      this.tagsService.getSuggestions('mods_engine'),
      this.tagsService.getSuggestions('mods_footwork'),
      this.tagsService.getSuggestions('feature'),
    ]);

    return {
      model,
      chassisCode,
      engineCode,
      transmission,
      drivetrain,
      condition,
      paperwork,
      year,
      location,
      mods: [
        ...mods_exterior,
        ...mods_interior,
        ...mods_engine,
        ...mods_footwork,
      ],
      notableFeatures,
    };
  }

  // Cascading filters: Level 1 - Get models by brand
  async getModelsByBrand(make: string): Promise<string[]> {
    const models = await this.carsRepository
      .createQueryBuilder('car')
      .leftJoin('car.seller', 'seller')
      .select('DISTINCT car.model', 'model')
      .where('car.make ILIKE :make', { make: `%${make}%` })
      .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
      .andWhere('car.status IN (:...statuses)', {
        statuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
      })
      .getRawMany();

    return models
      .map((m) => m.model)
      .filter(Boolean)
      .sort();
  }

  // Cascading filters: Level 2 - Get trims by brand + model
  async getTrimsByModel(make: string, model: string): Promise<string[]> {
    const trims = await this.carsRepository
      .createQueryBuilder('car')
      .leftJoin('car.seller', 'seller')
      .select('DISTINCT car.trim', 'trim')
      .where('car.make ILIKE :make', { make: `%${make}%` })
      .andWhere('car.model ILIKE :model', { model: `%${model}%` })
      .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
      .andWhere('car.status IN (:...statuses)', {
        statuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
      })
      .getRawMany();

    return trims
      .map((t) => t.trim)
      .filter(Boolean)
      .sort();
  }

  // Cascading filters: Level 3 - Get all remaining filter options
  async getFilterDetails(
    make: string,
    model?: string,
    trim?: string,
  ): Promise<any> {
    const baseQuery = this.carsRepository
      .createQueryBuilder('car')
      .leftJoin('car.seller', 'seller')
      .where('car.make ILIKE :make', { make: `%${make}%` })
      .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
      .andWhere('car.status IN (:...statuses)', {
        statuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
      });

    if (model) {
      baseQuery.andWhere('car.model ILIKE :model', { model: `%${model}%` });
    }
    if (trim) {
      baseQuery.andWhere('car.trim ILIKE :trim', { trim: `%${trim}%` });
    }

    // Helper to get distinct values for a column
    const getDistinct = async (col: string) => {
      const q = baseQuery.clone();
      const res = await q
        .select(`DISTINCT car.${col}`, 'val')
        .andWhere(`car.${col} IS NOT NULL`)
        .getRawMany();
      return res
        .map((r) => r.val?.toUpperCase())
        .filter(Boolean)
        .sort();
    };

    // Helper for year (descending)
    const getDistinctYears = async () => {
      const q = baseQuery.clone();
      const res = await q
        .select('DISTINCT car.year', 'val')
        .orderBy('val', 'DESC')
        .getRawMany();
      return res.map((r) => r.val?.toString()).filter(Boolean);
    };

    // Helper for price range
    const getPriceRange = async () => {
      const q = baseQuery.clone();
      const res = await q
        .select('MIN(CAST(car.price AS BIGINT))', 'min')
        .addSelect('MAX(CAST(car.price AS BIGINT))', 'max')
        .getRawOne();
      return {
        min: res?.min ? parseInt(res.min) : 0,
        max: res?.max ? parseInt(res.max) : 0,
      };
    };

    // Helper for mods (This is still tricky with simple-array or jsonb without unpacking)
    // Since we cannot easily "SELECT DISTINCT json_elements" without raw Postgres functions which might fail across DBs or look messy,
    // and assuming "mods" count is not huge per car, we might still have to use some logic or just fetch all mods strings if possible?
    // But for performance, fetching just the `mods` column is better than fetching entire entities.
    const getMods = async () => {
      const q = baseQuery.clone();
      const res = await q
        .select('car.mods', 'mods')
        .andWhere('car.mods IS NOT NULL')
        .getRawMany();
      const modSet = new Set<string>();
      res.forEach((r) => {
        const m = r.mods;
        if (Array.isArray(m)) {
          m.forEach((v: any) => {
            if (typeof v === 'string') modSet.add(v.trim().toUpperCase());
            else if (v && v.name) modSet.add(v.name.trim().toUpperCase());
          });
        } else if (typeof m === 'object') {
          Object.values(m).forEach((values: any) => {
            if (Array.isArray(values)) {
              values.forEach((v: string) => {
                if (v && typeof v === 'string')
                  modSet.add(v.trim().toUpperCase());
              });
            }
          });
        }
      });
      return Array.from(modSet).sort();
    };

    // Helper for notableFeatures
    const getNotableFeatures = async () => {
      const q = baseQuery.clone();
      const res = await q
        .select('car.notableFeatures', 'nf')
        .andWhere('car.notableFeatures IS NOT NULL')
        .getRawMany();
      const nfSet = new Set<string>();
      res.forEach((r) => {
        const raw = r.nf;
        // TypeORM simple-array comes as string "a,b,c" in raw result or parsed?
        // It depends on driver. Postgres raw might be string. TypeORM hydrate handles it.
        // getRawMany returns DB values. simple-array in Postgres is text.
        if (typeof raw === 'string') {
          raw.split(',').forEach((s) => nfSet.add(s.trim()));
        }
      });
      return Array.from(nfSet).sort();
    };

    const [
      chassisCode,
      engineCode,
      transmission,
      drivetrain,
      condition,
      paperwork,
      year,
      location,
      priceRange,
      mods,
      notableFeatures,
      count,
    ] = await Promise.all([
      getDistinct('chassisCode'),
      getDistinct('engineCode'),
      getDistinct('transmission'),
      getDistinct('drivetrain'),
      getDistinct('condition'),
      getDistinct('paperwork'),
      getDistinctYears(),
      getDistinct('location'),
      getPriceRange(),
      getMods(),
      getNotableFeatures(),
      baseQuery.getCount(),
    ]);

    return {
      chassisCode,
      engineCode,
      transmission,
      drivetrain,
      condition,
      paperwork,
      year,
      location,
      mods,
      notableFeatures,
      priceRange,
      count,
    };
  }

  // Smart unified search filter - returns all available options based on current selections
  async getSmartFilters(query: {
    make?: string;
    model?: string;
    chassisCode?: string;
    engineCode?: string;
    transmission?: string;
    drivetrain?: string;
    condition?: string;
    paperwork?: string;
    mods?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    location?: string;
    notableFeatures?: string;
    trim?: string;
    year?: string;
    q?: string;
    mods_exterior?: string;
    mods_interior?: string;
    mods_engine?: string;
    mods_footwork?: string;
  }): Promise<any> {
    const qb = this.carsRepository.createQueryBuilder('car');
    qb.leftJoin('car.seller', 'seller');
    qb.where('seller.isSellingBanned = :isBanned', { isBanned: false });
    qb.andWhere('car.status IN (:...statuses)', {
      statuses: [CarStatus.AVAILABLE, CarStatus.SOLD],
    });

    // Apply existing filters - Use ILIKE without wildcard for exact but case-insensitive match
    if (query.make) {
      qb.andWhere('car.make ILIKE :make', { make: query.make });
    }
    if (query.model) {
      qb.andWhere('car.model ILIKE :model', { model: query.model });
    }
    if (query.chassisCode) {
      qb.andWhere('car.chassisCode ILIKE :chassisCode', {
        chassisCode: query.chassisCode,
      });
    }
    if (query.engineCode) {
      qb.andWhere('car.engineCode ILIKE :engineCode', {
        engineCode: query.engineCode,
      });
    }
    if (query.transmission) {
      qb.andWhere('car.transmission ILIKE :transmission', {
        transmission: query.transmission,
      });
    }
    if (query.drivetrain) {
      qb.andWhere('car.drivetrain ILIKE :drivetrain', {
        drivetrain: query.drivetrain,
      });
    }
    if (query.condition) {
      qb.andWhere('car.condition ILIKE :condition', {
        condition: query.condition,
      });
    }
    if (query.paperwork) {
      qb.andWhere('car.paperwork ILIKE :paperwork', {
        paperwork: query.paperwork,
      });
    }
    if (query.mods) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods', {
        mods: `%"${query.mods}"%`,
      });
    }
    if (query.mods_exterior) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_exterior', {
        mods_exterior: `%"${query.mods_exterior}"%`,
      });
    }
    if (query.mods_interior) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_interior', {
        mods_interior: `%"${query.mods_interior}"%`,
      });
    }
    if (query.mods_engine) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_engine', {
        mods_engine: `%"${query.mods_engine}"%`,
      });
    }
    if (query.mods_footwork) {
      qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods_footwork', {
        mods_footwork: `%"${query.mods_footwork}"%`,
      });
    }
    if (query.trim) {
      qb.andWhere('car.trim ILIKE :trim', { trim: query.trim });
    }
    if (query.year) {
      qb.andWhere('car.year = :year', { year: parseInt(query.year) });
    }
    if (query.minPrice) {
      qb.andWhere('CAST(car.price AS BIGINT) >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice) {
      qb.andWhere('CAST(car.price AS BIGINT) <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }
    if (query.minYear) {
      qb.andWhere('car.year >= :minYear', { minYear: query.minYear });
    }
    if (query.maxYear) {
      qb.andWhere('car.year <= :maxYear', { maxYear: query.maxYear });
    }
    if (query.location) {
      qb.andWhere('car.location ILIKE :location', {
        location: query.location,
      });
    }
    if (query.notableFeatures) {
      qb.andWhere('car.notableFeatures ILIKE :notableFeatures', {
        notableFeatures: query.notableFeatures,
      });
    }

    // Integrate keyword search (q) into smart filters
    if (query.q) {
      const searchWords = query.q
        .trim()
        .split(/\s+/)
        .filter((w: string) => w.length > 0);

      const searchableFields = `CONCAT_WS(' ', 
                COALESCE(car.make, ''), 
                COALESCE(car.model, ''), 
                COALESCE(car.trim, ''), 
                COALESCE(car.chassisCode, ''), 
                COALESCE(car.engineCode, ''), 
                COALESCE(car.transmission, ''),
                COALESCE(car.drivetrain, ''),
                COALESCE(car.condition, ''), 
                COALESCE(car.paperwork, ''), 
                COALESCE(car.description, ''),
                COALESCE(CAST(car.mods AS TEXT), '')
            )`;

      searchWords.forEach((word: string, index: number) => {
        const paramName = `sq${index}`;
        qb.andWhere(`${searchableFields} ILIKE :${paramName}`, {
          [paramName]: `%${word}%`,
        });
      });
    }

    // --- OPTIMIZATION: Use SQL Aggregation instead of loading all entities ---
    // 1. Get total count and ranges
    const statsQuery = qb
      .clone()
      .select('COUNT(car.id)', 'total')
      .addSelect('MIN(CAST(car.price AS BIGINT))', 'minPrice')
      .addSelect('MAX(CAST(car.price AS BIGINT))', 'maxPrice')
      .addSelect('MIN(car.year)', 'minYear')
      .addSelect('MAX(car.year)', 'maxYear')
      .addSelect('MIN(car.mileage)', 'minMileage')
      .addSelect('MAX(car.mileage)', 'maxMileage');

    const stats = await statsQuery.getRawOne();
    const totalCount = parseInt(stats.total || '0');

    if (totalCount === 0) {
      return {
        options: {
          make: [],
          model: [],
          trim: [],
          year: [],
          chassisCode: [],
          engineCode: [],
          transmission: [],
          drivetrain: [],
          condition: [],
          paperwork: [],
          location: [],
          notableFeatures: [],
          mods: [],
          mods_exterior: [],
          mods_interior: [],
          mods_engine: [],
          mods_footwork: [],
        },
        ranges: {
          price: { min: 0, max: 0 },
          year: { min: 1980, max: new Date().getFullYear() },
          mileage: { min: 0, max: 0 },
        },
        count: 0,
        counts: { total: 0 },
      };
    }

    // 2. Get distinct values for simple columns using parallel queries
    const simpleColumns = [
      'make',
      'model',
      'trim',
      'year',
      'chassisCode',
      'engineCode',
      'transmission',
      'drivetrain',
      'condition',
      'paperwork',
      'location',
    ];

    const getDistinctValues = async (column: string) => {
      const res = await qb
        .clone()
        .select(`DISTINCT car.${column}`, 'value')
        .where(`car.${column} IS NOT NULL`)
        // Re-apply common filters from qb
        .getRawMany();
      return {
        column,
        values: res
          .map((r) => r.value?.toString().toUpperCase())
          .filter(Boolean)
          .sort(),
      };
    };

    // 3. Special handling for array/JSON columns
    const getNotableFeatures = async () => {
      // In Postgres, we can use unnest for simple-array (which is stored as text with comma)
      // but simple-array is tricky in raw SQL. Let's use getRawMany for just this column.
      const res = await qb
        .clone()
        .select('car.notableFeatures', 'nf')
        .where('car.notableFeatures IS NOT NULL')
        .getRawMany();

      const set = new Set<string>();
      res.forEach((r) => {
        if (typeof r.nf === 'string') {
          r.nf.split(',').forEach((s) => {
            const val = s.trim().toUpperCase();
            if (val) set.add(val);
          });
        }
      });
      return Array.from(set).sort();
    };

    const getModsStats = async () => {
      const res = await qb
        .clone()
        .select('car.mods', 'mods')
        .where('car.mods IS NOT NULL')
        .getRawMany();

      const options = {
        mods: new Set<string>(),
        mods_exterior: new Set<string>(),
        mods_interior: new Set<string>(),
        mods_engine: new Set<string>(),
        mods_footwork: new Set<string>(),
      };

      res.forEach((r) => {
        const mods = r.mods;
        if (Array.isArray(mods)) {
          mods.forEach((mod: any) => {
            const val =
              typeof mod === 'string'
                ? mod.trim().toUpperCase()
                : mod?.name?.trim().toUpperCase();
            if (val) {
              options.mods.add(val);
              options.mods_exterior.add(val);
            }
          });
        } else if (typeof mods === 'object' && mods !== null) {
          const categories = ['exterior', 'interior', 'engine', 'footwork'];
          categories.forEach((cat) => {
            const field = `mods_${cat}` as keyof typeof options;
            if (Array.isArray(mods[cat])) {
              mods[cat].forEach((v: any) => {
                if (typeof v === 'string' && v.trim()) {
                  const val = v.trim().toUpperCase();
                  options[field].add(val);
                  options.mods.add(val);
                }
              });
            }
          });
        }
      });

      return {
        mods: Array.from(options.mods).sort(),
        mods_exterior: Array.from(options.mods_exterior).sort(),
        mods_interior: Array.from(options.mods_interior).sort(),
        mods_engine: Array.from(options.mods_engine).sort(),
        mods_footwork: Array.from(options.mods_footwork).sort(),
      };
    };

    // Execute everything in parallel
    const [distinctResults, nfResults, modsResults] = await Promise.all([
      Promise.all(simpleColumns.map((col) => getDistinctValues(col))),
      getNotableFeatures(),
      getModsStats(),
    ]);

    const finalOptions: any = {
      notableFeatures: nfResults,
      ...modsResults,
    };

    distinctResults.forEach((res) => {
      finalOptions[res.column] = res.values;
    });

    // Handle years sort (DESC)
    if (finalOptions.year) {
      finalOptions.year.sort(
        (a: string, b: string) => parseInt(b) - parseInt(a),
      );
    }

    return {
      options: finalOptions,
      ranges: {
        price: {
          min: parseInt(stats.minPrice || '0'),
          max: parseInt(stats.maxPrice || '0'),
        },
        year: {
          min: stats.minYear || 1980,
          max: stats.maxYear || new Date().getFullYear(),
        },
        mileage: {
          min: stats.minMileage || 0,
          max: stats.maxMileage || 0,
        },
      },
      count: totalCount,
      counts: {
        total: totalCount,
      },
    };
  }

  async getTagsStats(): Promise<
    { category: string; items: { tag: string; count: number }[] }[]
  > {
    // Delegate to TagsService which reads from Tag table
    return this.tagsService.getAllTagsStats();
  }

  // Circular dependency note: We need UsersService to ban user.
  // BUT UsersService imports CarsService.
  // To avoid circular dependency issues at module level, we can forwardRef
  // OR just handle the logic in the Controller by calling both services.
  // However, "deleteTagWithPenalty" feels like a business logic unit.
  // Let's try to inject ModuleRef or keep it simple.
  // Actually, UsersService already imports CarsService.
  // If we import UsersService here, we get Circular Dependency.
  //
  // Better approach: Return the "initiatorUserID" from this method,
  // and let the Controller call usersService.banUser(initiatorId).
  // Or, keep the ban logic in UsersService and deletion logic here.
  //
  // Let's implement `findInitiatorAndCars(tag)` here, and handle the orchestration in the controller or a higher level facade?
  // Or simply, Since `deleteTagWithPenalty` is complex, let's put it in the service but return the userId to ban.

  async deleteTagWithPenalty(tag: string): Promise<string | null> {
    const targetTag = tag.trim().toUpperCase();

    // 1. Find all cars with this tag using a more efficient SQL-first approach
    // We search across all relevant columns. This is still a broad search but better than loading EVERYTHING.
    const qb = this.carsRepository.createQueryBuilder('car');
    qb.leftJoinAndSelect('car.seller', 'seller');

    // Simple columns
    const columns = [
      'make',
      'model',
      'chassisCode',
      'engineCode',
      'transmission',
      'drivetrain',
      'condition',
      'paperwork',
      'location',
    ];
    const whereConditions = columns.map((col) => `UPPER(car.${col}) = :tag`);
    whereConditions.push('CAST(car.year AS TEXT) = :tag');

    // JSON/Array columns search using ILIKE for robustness (Postgres specific optimization could be better but this is safe)
    // We search for the tag wrapped in quotes if it's in a JSON array or as a standalone string
    qb.where(`(${whereConditions.join(' OR ')})`, { tag: targetTag });
    qb.orWhere('car.notableFeatures ILIKE :tagPattern', {
      tagPattern: `%${targetTag}%`,
    });
    qb.orWhere('CAST(car.mods AS TEXT) ILIKE :tagPattern', {
      tagPattern: `%${targetTag}%`,
    });

    qb.orderBy('car.createdAt', 'ASC');

    const verifiedCars = await qb.getMany();

    if (verifiedCars.length === 0) {
      // Still delete the tag from Tag table even if no cars are using it
      await this.tagsService.deleteTagByValue(tag);
      return null;
    }

    // Find initiator (already sorted by createdAt ASC)
    const initiator = verifiedCars[0].seller;

    // Delete ALL cars with this tag
    // Delete images and decrement tags for each car
    for (const car of verifiedCars) {
      await this.deleteCarImages(car);
      await this.tagsService.syncTagsFromCar(car, false);
    }

    await this.carsRepository.remove(verifiedCars);

    // Permanently remove the tag from Tag table so it doesn't show in suggestions
    await this.tagsService.deleteTagByValue(tag);

    // Send notification to the initiator
    if (initiator) {
      await this.notificationsService.createNotification(
        initiator.id,
        NotificationType.POST_DELETED,
        'Bài đăng bị xóa hàng loạt',
        `Hệ thống phát hiện spam tag "${tag}". Các bài đăng liên quan đã bị xóa và tài khoản có thể bị xử lý.`,
      );
    }

    return initiator ? initiator.id : null;
  }

  async incrementView(
    carId: string,
    clientInfo: { userId?: string; ipAddress: string; userAgent: string },
  ): Promise<void> {
    const { userId, ipAddress, userAgent } = clientInfo;

    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const queryBuilder = this.carViewRepository
        .createQueryBuilder('cv')
        .where('cv.carId = :carId', { carId })
        .andWhere('cv.viewedAt > :since', { since: twentyFourHoursAgo });

      if (userId) {
        queryBuilder.andWhere('cv.userId = :userId', { userId });
      } else if (ipAddress && userAgent) {
        queryBuilder
          .andWhere('cv.ipAddress = :ipAddress', { ipAddress })
          .andWhere('cv.userAgent = :userAgent', { userAgent });
      }

      const existingView = await queryBuilder.getOne();

      if (!existingView) {
        // Ensure car still exists before incrementing to avoid FK constraint error
        const carExists = await this.carsRepository.findOne({
          where: { id: carId },
          select: ['id'],
        });

        if (!carExists) {
          this.logger.warn(
            `Attempted to increment view for non-existent car: ${carId}`,
          );
          return;
        }

        await this.dataSource.transaction(async (manager) => {
          const view = new CarView();
          view.carId = carId;
          view.userId = userId || null;
          view.ipAddress = ipAddress || null;
          view.userAgent = userAgent || null;
          await manager.save(view);

          await manager.update(Car, carId, {
            views: () => 'views + 1',
          });
        });
      }
    } catch (error) {
      this.logger.error(
        `Error in incrementView: ${error.message}`,
        error.stack,
      );
    }
  }

  async getCarRanking(id: string) {
    const car = await this.carsRepository.findOne({ where: { id } });
    if (!car) throw new NotFoundException('Car not found');

    const publicStatuses = [CarStatus.AVAILABLE, CarStatus.SOLD];

    // Helper to create base query with consistent filters (Public status + No banned sellers)
    const createBaseQb = (alias: string) => {
      return this.carsRepository
        .createQueryBuilder(alias)
        .leftJoin(`${alias}.seller`, 'seller')
        .where(`${alias}.status IN (:...statuses)`, { statuses: publicStatuses })
        .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false });
    };

    const [globalTotal, globalRank, makeTotal, makeRank] = await Promise.all([
      // 1. All public cars
      createBaseQb('car').getCount(),

      // 2. Public cars newer than current car (to determine rank)
      createBaseQb('car')
        .andWhere('car.createdAt > :createdAt', { createdAt: car.createdAt })
        .andWhere('car.id != :id', { id: car.id })
        .getCount(),

      // 3. All public cars of same make
      createBaseQb('car')
        .andWhere('car.make = :make', { make: car.make })
        .getCount(),

      // 4. Public cars of same make newer than current car
      createBaseQb('car')
        .andWhere('car.make = :make', { make: car.make })
        .andWhere('car.createdAt > :createdAt', { createdAt: car.createdAt })
        .andWhere('car.id != :id', { id: car.id })
        .getCount(),
    ]);

    return {
      global: {
        rank: globalRank + 1,
        total: globalTotal,
      },
      make: {
        rank: makeRank + 1,
        total: makeTotal,
        name: car.make,
      },
    };
  }

  async editTag(
    category: string,
    oldTag: string,
    newTag: string,
  ): Promise<void> {
    this.logger.log(
      `Editing tag: category=${category}, old=${oldTag}, new=${newTag}`,
    );

    const targetTag = oldTag.trim().toUpperCase();
    let updatedCount = 0;

    // Build optimized query based on category to avoid loading ALL cars
    const qb = this.carsRepository.createQueryBuilder('car');

    // Add WHERE clause based on category for efficient filtering
    if (category === 'make') {
      qb.where('UPPER(car.make) = :tag', { tag: targetTag });
    } else if (category === 'model') {
      qb.where('UPPER(car.model) = :tag', { tag: targetTag });
    } else if (category === 'trim') {
      qb.where('UPPER(car.trim) = :tag', { tag: targetTag });
    } else if (category === 'chassisCode') {
      qb.where('UPPER(car.chassisCode) = :tag', { tag: targetTag });
    } else if (category === 'engineCode') {
      qb.where('UPPER(car.engineCode) = :tag', { tag: targetTag });
    } else if (category === 'transmission') {
      qb.where('UPPER(car.transmission) = :tag', { tag: targetTag });
    } else if (category === 'drivetrain') {
      qb.where('UPPER(car.drivetrain) = :tag', { tag: targetTag });
    } else if (category === 'condition') {
      qb.where('UPPER(car.condition) = :tag', { tag: targetTag });
    } else if (category === 'paperwork') {
      qb.where('UPPER(car.paperwork) = :tag', { tag: targetTag });
    } else if (category === 'year') {
      qb.where('CAST(car.year AS TEXT) = :tag', { tag: targetTag });
    } else if (category === 'location') {
      qb.where('UPPER(car.location) = :tag', { tag: targetTag });
    } else if (category === 'feature') {
      // notableFeatures is simple-array, search with ILIKE
      qb.where('car.notableFeatures ILIKE :tagPattern', {
        tagPattern: `%${targetTag}%`,
      });
    } else if (category.startsWith('mods')) {
      // mods is JSONB, search with ILIKE on cast
      qb.where('CAST(car.mods AS TEXT) ILIKE :tagPattern', {
        tagPattern: `%"${targetTag}"%`,
      });
    } else {
      // Unknown category, return early
      this.logger.warn(`Unknown category: ${category}`);
      return;
    }

    const matchingCars = await qb.getMany();
    this.logger.log(`Found ${matchingCars.length} cars matching tag in category ${category}`);

    for (const car of matchingCars) {
      let matches = false;

      // Check if car matches the tag in the specific category
      if (category === 'make' && car.make?.trim().toUpperCase() === targetTag)
        matches = true;
      else if (
        category === 'model' &&
        car.model?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'trim' &&
        car.trim?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'chassisCode' &&
        car.chassisCode?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'engineCode' &&
        car.engineCode?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'transmission' &&
        car.transmission?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'drivetrain' &&
        car.drivetrain?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'condition' &&
        car.condition?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (
        category === 'paperwork' &&
        car.paperwork?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (category === 'year' && car.year?.toString() === targetTag)
        matches = true;
      else if (
        category === 'location' &&
        car.location?.trim().toUpperCase() === targetTag
      )
        matches = true;
      else if (category === 'feature' && car.notableFeatures) {
        if (
          car.notableFeatures.some((f) => f.trim().toUpperCase() === targetTag)
        )
          matches = true;
      } else if (category.startsWith('mods') && car.mods) {
        if (Array.isArray(car.mods)) {
          if (
            car.mods.some((m: any) => {
              const val = typeof m === 'string' ? m : m?.name;
              return val && val.trim().toUpperCase() === targetTag;
            })
          )
            matches = true;
        } else if (typeof car.mods === 'object') {
          const modType = category.replace('mods_', '');
          if (car.mods[modType] && Array.isArray(car.mods[modType])) {
            if (
              car.mods[modType].some(
                (m: string) => m.trim().toUpperCase() === targetTag,
              )
            )
              matches = true;
          }
        }
      }

      if (matches) {
        this.logger.log(`Found match in car ${car.id}`);

        // 1. Decrement OLD tag usage
        await this.tagsService.syncTagsFromCar(car, false);

        // 2. Apply Change
        if (category === 'make') car.make = newTag;
        else if (category === 'model') car.model = newTag;
        else if (category === 'trim') car.trim = newTag;
        else if (category === 'chassisCode') car.chassisCode = newTag;
        else if (category === 'engineCode') car.engineCode = newTag;
        else if (category === 'transmission') car.transmission = newTag;
        else if (category === 'drivetrain') car.drivetrain = newTag;
        else if (category === 'condition') car.condition = newTag;
        else if (category === 'paperwork') car.paperwork = newTag;
        else if (category === 'year') {
          const y = parseInt(newTag);
          if (!isNaN(y)) car.year = y;
        } else if (category === 'location') car.location = newTag;
        else if (category === 'feature' && car.notableFeatures) {
          car.notableFeatures = car.notableFeatures.map((f) =>
            f.trim().toUpperCase() === targetTag ? newTag : f,
          );
        } else if (category.startsWith('mods') && car.mods) {
          // Clone mods object to ensure TypeORM detects change
          const modsClone = JSON.parse(JSON.stringify(car.mods)) as Record<string, string[]>;

          // Handle object-based mods structure
          const modType = category.replace('mods_', '') as keyof typeof modsClone;
          if (modsClone[modType] && Array.isArray(modsClone[modType])) {
            modsClone[modType] = modsClone[modType].map((m: string) =>
              m.trim().toUpperCase() === targetTag ? newTag : m,
            );
            // Reassign to trigger update
            car.mods = modsClone;
          }
        }

        // 3. Save Car
        await this.carsRepository.save(car);
        updatedCount++;

        // 4. Increment NEW tag usage
        await this.tagsService.syncTagsFromCar(car, true);
      }
    }
    this.logger.log(`Updated ${updatedCount} cars with new tag "${newTag}"`);
  }
}
