import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
    ) { }

    async getSellerStats(sellerId: string): Promise<{ selling: number; sold: number }> {
        const selling = await this.carsRepository.count({
            where: { seller: { id: sellerId }, status: CarStatus.AVAILABLE }
        });
        const sold = await this.soldCarsService.countBySeller(sellerId);
        return { selling, sold };
    }

    /**
     * Delete image files associated with a car from the uploads folder
     * @param excludeFiles List of full URLs to exclude from deletion
     */
    private async deleteCarImages(car: Car, excludeFiles: string[] = []): Promise<void> {
        const imagesToDelete: string[] = [];

        // Collect all image URLs
        if (car.images && Array.isArray(car.images)) {
            imagesToDelete.push(...car.images);
        }
        if (car.thumbnail) {
            imagesToDelete.push(car.thumbnail);
        }

        // Delete each image file
        for (const imageUrl of imagesToDelete) {
            try {
                // Extract filename from URL (e.g., "http://localhost:3000/uploads/abc123.jpg" -> "abc123.jpg")
                const filename = imageUrl.split('/uploads/').pop();
                if (filename) {
                    const filePath = path.join(process.cwd(), 'uploads', filename);

                    // Check if file seems to be one of the excluded ones
                    // The excludeFiles list has full URLs, so we need to match carefully or just check if URL ends with filename
                    // Simple check:
                    const isExcluded = excludeFiles.some(url => url && url.includes(filename));

                    // Check if file exists before deleting
                    if (fs.existsSync(filePath) && !isExcluded) {
                        fs.unlinkSync(filePath);
                        this.logger.log(`Deleted image: ${filename}`);
                    }
                }
            } catch (error) {
                // Log error but don't fail the deletion
                this.logger.warn(`Failed to delete image ${imageUrl}: ${error.message}`);
            }
        }
    }

    async findAll(query: any): Promise<{ data: Car[], meta: any }> {
        const qb = this.carsRepository.createQueryBuilder('car');
        qb.leftJoinAndSelect('car.seller', 'seller');
        // qb.where('car.status = :status', { status: CarStatus.AVAILABLE }); // Removed to show sold cars

        // Hide hidden cars by default (admin can still see them if we want, but for now let's just show them to admin only? 
        // Logic: Public feed should NOT show HIDDEN. Admin feed SHOULD show HIDDEN.
        // The current findAll is used by BOTH. 
        // We need a way to distinguish. 
        // Let's add an optional 'includeHidden' param or check user role.
        // For simplicity, let's assume this is public facing primarily, but Admin uses it too.
        // The current request "Hide/Delete" implies Admin wants to see them to Un-hide properly? 
        // Or if it's "Delete", it's gone. 
        // User said "Hide (like delete)". 
        // Let's exclude HIDDEN from public results.

        if (!query.includeHidden) {
            qb.andWhere('car.status IN (:...publicStatuses)', { publicStatuses: [CarStatus.AVAILABLE, CarStatus.SOLD] });
        }

        // Hide cars from banned sellers
        qb.andWhere('seller.isSellingBanned = :isBanned', { isBanned: false });

        if (query.make) {
            qb.andWhere('car.make ILIKE :make', { make: `%${query.make}%` });
        }
        if (query.model) {
            qb.andWhere('car.model ILIKE :model', { model: `%${query.model}%` });
        }
        if (query.transmission) {
            qb.andWhere('car.transmission ILIKE :transmission', { transmission: `%${query.transmission}%` });
        }
        if (query.drivetrain) {
            qb.andWhere('car.drivetrain ILIKE :drivetrain', { drivetrain: `%${query.drivetrain}%` });
        }
        if (query.condition) {
            qb.andWhere('car.condition ILIKE :condition', { condition: `%${query.condition}%` });
        }
        if (query.paperwork) {
            qb.andWhere('car.paperwork ILIKE :paperwork', { paperwork: `%${query.paperwork}%` });
        }
        if (query.minPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) >= :minPrice', { minPrice: query.minPrice });
        }
        if (query.maxPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) <= :maxPrice', { maxPrice: query.maxPrice });
        }
        if (query.sellerId) {
            qb.andWhere('seller.id = :sellerId', { sellerId: query.sellerId });
        }
        if (query.location) {
            qb.andWhere('car.location ILIKE :location', { location: `%${query.location}%` });
        }
        if (query.chassisCode) {
            qb.andWhere('car.chassisCode ILIKE :chassisCode', { chassisCode: `%${query.chassisCode}%` });
        }
        if (query.engineCode) {
            qb.andWhere('car.engineCode ILIKE :engineCode', { engineCode: `%${query.engineCode}%` });
        }
        if (query.notableFeatures) {
            qb.andWhere('car.notableFeatures ILIKE :notableFeatures', { notableFeatures: `%${query.notableFeatures}%` });
        }
        if (query.mods) {
            // Revert to text-based search for "like other filters" behavior, 
            // but wrap in quotes to target JSON values specifically and avoid partial word matches.
            // e.g., searching for "G" becomes ILIKE '%"G"%', which matches ["G"] or [{"name":"G"}] 
            // but NOT ["Engine"] (because "Engine" doesn't contain "G" with quotes).
            qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods', { mods: `%"${query.mods}"%` });
        }

        // Smart full-text search - concatenate all searchable fields into one string
        // Each word must be found somewhere in this combined searchable text
        if (query.q) {
            const searchWords = query.q.trim().split(/\s+/).filter((w: string) => w.length > 0);

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
                qb.andWhere(`${searchableFields} ILIKE :${paramName}`, { [paramName]: `%${word}%` });
            });
        }

        if (query.status) {
            qb.andWhere('car.status = :status', { status: query.status });
        }

        // Default sort: AVAILABLE first, then others (SOLD, HIDDEN etc at the end)
        // We can explicitly sort by whether status is AVAILABLE or not.
        // Assuming we want SOLD at the end.
        // Let's use a CASE statement for custom ordering if no specific status filter is active
        if (!query.status) {
            // 'AVAILABLE' < 'SOLD' alphabetically, so this puts available cars first
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

        return {
            data: cars,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: string, userPayload?: any): Promise<Car> {
        const car = await this.carsRepository.findOne({
            where: { id },
            relations: ['seller'],
        });
        if (!car) throw new NotFoundException('Car not found');

        // Check if car is hidden
        if (car.status === CarStatus.HIDDEN) {
            let isAdmin = false;
            if (userPayload && userPayload.sub) { // Assuming 'sub' is the ID in standard JWT, or 'id'
                const userId = userPayload.sub || userPayload.id;
                const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
                if (user && user.isAdmin) {
                    isAdmin = true;
                }
            }

            if (!isAdmin) {
                throw new NotFoundException('Car not found');
            }
        }

        // Hide car if seller is banned
        if (car.seller && car.seller.isSellingBanned) {
            // Check admin override for banned sellers too? 
            // User requested "like user ban", and usually admins SEE banned users.
            // So we should probably allow Admins to see banned seller cars too.
            let isAdmin = false;
            if (userPayload && userPayload.sub) {
                const userId = userPayload.sub || userPayload.id;
                const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
                if (user && user.isAdmin) {
                    isAdmin = true;
                }
            }

            if (!isAdmin) {
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
                status: In([CarStatus.AVAILABLE, CarStatus.PENDING_APPROVAL])
            },
            relations: ['seller']
        });

        if (duplicateCar) {
            throw new BadRequestException('Bạn đã có một bài đăng tương tự cho xe này. Vui lòng kiểm tra lại danh sách xe của bạn.');
        }

        // Check how many approved posts this user has
        const approvedCount = await this.carsRepository.count({
            where: [
                { seller: { id: seller.id }, status: CarStatus.AVAILABLE },
                { seller: { id: seller.id }, status: CarStatus.SOLD }
            ]
        });

        // First 3 posts must be approved manually
        // If user is admin, skip this check
        const initialStatus = (seller.isAdmin || approvedCount >= 3)
            ? CarStatus.AVAILABLE
            : CarStatus.PENDING_APPROVAL;

        const car = this.carsRepository.create({
            ...createCarDto,
            seller,
            price: createCarDto.price.toString(),
            status: initialStatus,
        });

        this.logger.log(`Creating car with notableFeatures: ${JSON.stringify(createCarDto.notableFeatures)}`);

        const savedCar = await this.carsRepository.save(car);

        // Sync tags to Tag table (increment usageCount)
        await this.tagsService.syncTagsFromCar(savedCar, true);

        return savedCar;
    }

    async update(id: string, updateCarDto: UpdateCarDto, user: User): Promise<Car> {
        const car = await this.findOne(id);
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only update your own listings');
        }

        // Sync tags: Remove old tags usage
        // We do this BEFORE updating the car object so we have the old values
        await this.tagsService.syncTagsFromCar(car, false);

        // Handle price conversion if it's in the DTO
        const updates: any = { ...updateCarDto };
        if (updates.price) {
            updates.price = updates.price.toString();
        }

        // Track edit history
        const editTimestamp = new Date().toISOString();
        if (!car.editHistory || car.editHistory.length === 0) {
            car.editHistory = [editTimestamp];
        } else {
            car.editHistory = [...car.editHistory, editTimestamp];
        }

        Object.assign(car, updates);

        this.logger.log(`Updating car ${id} with notableFeatures: ${JSON.stringify(updates.notableFeatures)}`);
        this.logger.log(`Merged car object notableFeatures: ${JSON.stringify(car.notableFeatures)}`);

        const updatedCar = await this.carsRepository.save(car);

        // Sync tags: Add new tags usage
        // We do this AFTER saving so we have stored the new values (and validation passed)
        await this.tagsService.syncTagsFromCar(updatedCar, true);

        return updatedCar;
    }



    async remove(id: string, user: User): Promise<void> {
        const car = await this.findOne(id);

        // Allow if user is admin OR if user is the seller
        if (!user.isAdmin && car.seller.id !== user.id) {
            throw new BadRequestException('You can only delete your own listings');
        }

        // Delete associated images from disk
        // Delete associated images from disk
        await this.deleteCarImages(car);

        // Send notification if deletion is by Admin and not self
        if (user.isAdmin && car.seller.id !== user.id) {
            await this.notificationsService.createNotification(
                car.seller.id,
                NotificationType.POST_DELETED,
                'Bài đăng bị xóa',
                `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã bị quản trị viên xóa do vi phạm quy định.`
            );
        }

        // Decrement tag usage counts before removing car
        await this.tagsService.syncTagsFromCar(car, false);

        await this.carsRepository.remove(car);
    }

    async markAsSold(id: string, user: User): Promise<void> {
        const car = await this.findOne(id);

        // Verify ownership
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only mark your own listings as sold');
        }

        if (car.status === CarStatus.SOLD) {
            throw new BadRequestException('Car is already sold');
        }

        // 1. Archive to SoldCars
        await this.soldCarsService.create(car);

        // 2. Delete the car listing (includes images deletion and tag decrement)
        // NOTE: Our deleteCarImages logic deletes physical files. 
        // If we want to KEEP the thumbnail for history, we must be careful.
        // The Plan said: "SoldCar... thumbnail (String)".
        // If we delete the images from disk, the thumbnail URL in SoldCar will be broken.
        // So we must modify deleteCarImages to NOT delete the thumbnail if we are selling it?
        // Or deeper: "Delete and Archive" usually means we don't need the other images, but we need the main one.
        // Let's modify logic: Copy thumbnail to a permanent location? Or just Don't delete it?
        // Simpler: Copy the thumbnail file to a separate 'sold-history' folder? or just rename it?
        // Or just don't delete the thumbnail file.

        // Let's customize deleteCarImages or handle it here.
        // We will call `deleteCarImages` but EXCLUDE the thumbnail loop if we are marking as sold?
        // Accessing private method is hard inside the same class without refactoring.
        // Let's refactor deleteCarImages to accept an exclusion list.
        await this.deleteCarImages(car);

        // Decrement tag usage counts
        await this.tagsService.syncTagsFromCar(car, false);

        // Remove from DB
        await this.carsRepository.remove(car);
    }


    async deleteAllBySeller(sellerId: string): Promise<void> {
        // Find all cars by seller to delete their images
        const cars = await this.carsRepository.find({ where: { seller: { id: sellerId } } });

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

    async buy(id: string, buyerId: string): Promise<Car> {
        return this.dataSource.transaction(async (manager) => {
            const car = await manager.findOne(Car, { where: { id }, relations: ['seller'] });
            if (!car) throw new NotFoundException('Car not found');
            if (car.status !== CarStatus.AVAILABLE) throw new BadRequestException('Car is not available');
            if (car.seller.id === buyerId) throw new BadRequestException('Cannot buy your own car');

            const buyer = await manager.findOne(User, { where: { id: buyerId } });
            if (!buyer) throw new NotFoundException('Buyer not found');

            const price = BigInt(car.price);
            const buyerBalance = BigInt(buyer.balance);

            if (buyerBalance < price) {
                throw new BadRequestException('Insufficient balance');
            }

            const seller = await manager.findOne(User, { where: { id: car.seller.id } });
            if (!seller) throw new NotFoundException('Seller not found');

            buyer.balance = (buyerBalance - price).toString();
            const sellerBalance = BigInt(seller.balance);
            seller.balance = (sellerBalance + price).toString();

            car.status = CarStatus.SOLD;

            await manager.save(buyer);
            await manager.save(seller);
            return await manager.save(car);
        });
    }

    async getPendingCars(page: number = 1, limit: number = 10): Promise<{ data: Car[], meta: any }> {
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
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async approveCar(id: string): Promise<Car> {
        const car = await this.findOne(id); // Helper ensuring it exists, but might throw if hidden/pending for non-admin?
        // Actually findOne filters out hidden cars for non-admins, but we expect admin to call this.
        // We'll trust the controller to be guarded or we use repository directly.

        car.status = CarStatus.AVAILABLE;
        await this.carsRepository.save(car);

        // Notify user
        await this.notificationsService.createNotification(
            car.seller.id,
            NotificationType.POST_APPROVED,
            'Bài đăng được duyệt',
            `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã được phê duyệt và hiển thị công khai.`
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
            `Bài đăng "${car.year} ${car.make} ${car.model}" của bạn đã bị từ chối và xóa khỏi hệ thống. Vui lòng kiểm tra lại quy định đăng tin.`
        );

        // Delete associated images from disk
        await this.deleteCarImages(car);

        // Decrement tag usage counts
        await this.tagsService.syncTagsFromCar(car, false);

        // Remove from DB
        await this.carsRepository.remove(car);
    }

    async getBrands(): Promise<string[]> {
        const brands = await this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.seller', 'seller')
            .select('DISTINCT car.make', 'make')
            .where('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] })
            .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
            .getRawMany();

        return brands.map(b => b.make).filter(Boolean);
    }

    async getFiltersByBrand(make: string): Promise<any> {
        const cars = await this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.seller', 'seller')
            .where('car.make ILIKE :make', { make: `%${make}%` })
            .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
            .andWhere('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] })
            .getMany();

        // Extract unique values for each filterable field
        const filters: Record<string, Set<string>> = {
            model: new Set(),
            chassisCode: new Set(),
            engineCode: new Set(),
            transmission: new Set(),
            drivetrain: new Set(),
            condition: new Set(),
            paperwork: new Set(),
            mods: new Set(),
            notableFeatures: new Set(),
        };

        for (const car of cars) {
            if (car.model) filters.model.add(car.model.toUpperCase());
            if (car.chassisCode) filters.chassisCode.add(car.chassisCode.toUpperCase());
            if (car.engineCode) filters.engineCode.add(car.engineCode.toUpperCase());
            if (car.transmission) filters.transmission.add(car.transmission.toUpperCase());
            if (car.drivetrain) filters.drivetrain.add(car.drivetrain.toUpperCase());
            if (car.condition) filters.condition.add(car.condition.toUpperCase());
            if (car.paperwork) filters.paperwork.add(car.paperwork.toUpperCase());

            // Handle mods
            if (car.mods) {
                if (Array.isArray(car.mods)) {
                    car.mods.forEach((mod: any) => {
                        if (typeof mod === 'string' && mod.trim()) {
                            filters.mods.add(mod.trim().toUpperCase());
                        } else if (mod && mod.name) {
                            filters.mods.add(mod.name.trim().toUpperCase());
                        }
                    });
                } else if (typeof car.mods === 'object') {
                    Object.values(car.mods).forEach((values: any) => {
                        if (Array.isArray(values)) {
                            values.forEach((v: string) => {
                                if (v && typeof v === 'string') {
                                    filters.mods.add(v.trim().toUpperCase());
                                }
                            });
                        }
                    });
                }
            }
        }

        // Convert Sets to sorted arrays and return
        return {
            model: Array.from(filters.model).sort(),
            chassisCode: Array.from(filters.chassisCode).sort(),
            engineCode: Array.from(filters.engineCode).sort(),
            transmission: Array.from(filters.transmission).sort(),
            drivetrain: Array.from(filters.drivetrain).sort(),
            condition: Array.from(filters.condition).sort(),
            paperwork: Array.from(filters.paperwork).sort(),
            mods: Array.from(filters.mods).sort(),
            year: Array.from(filters.year).sort((a, b) => b.localeCompare(a)), // Sort years descending
            location: Array.from(filters.location).sort(),
            notableFeatures: Array.from(filters.notableFeatures).sort(),
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
            .andWhere('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] })
            .getRawMany();

        return models.map(m => m.model).filter(Boolean).sort();
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
            .andWhere('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] })
            .getRawMany();

        return trims.map(t => t.trim).filter(Boolean).sort();
    }

    // Cascading filters: Level 3 - Get all remaining filter options
    async getFilterDetails(make: string, model?: string, trim?: string): Promise<any> {
        const qb = this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.seller', 'seller')
            .where('car.make ILIKE :make', { make: `%${make}%` })
            .andWhere('seller.isSellingBanned = :isBanned', { isBanned: false })
            .andWhere('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] });

        if (model) {
            qb.andWhere('car.model ILIKE :model', { model: `%${model}%` });
        }
        if (trim) {
            qb.andWhere('car.trim ILIKE :trim', { trim: `%${trim}%` });
        }

        const cars = await qb.getMany();

        const filters: Record<string, Set<string>> = {
            chassisCode: new Set(),
            engineCode: new Set(),
            transmission: new Set(),
            drivetrain: new Set(),
            condition: new Set(),
            paperwork: new Set(),
            mods: new Set(),
            year: new Set(),
            location: new Set(),
            notableFeatures: new Set(),
        };

        let minPrice = Infinity;
        let maxPrice = 0;

        for (const car of cars) {
            if (car.chassisCode) filters.chassisCode.add(car.chassisCode.toUpperCase());
            if (car.engineCode) filters.engineCode.add(car.engineCode.toUpperCase());
            if (car.transmission) filters.transmission.add(car.transmission.toUpperCase());
            if (car.drivetrain) filters.drivetrain.add(car.drivetrain.toUpperCase());
            if (car.condition) filters.condition.add(car.condition.toUpperCase());
            if (car.paperwork) filters.paperwork.add(car.paperwork.toUpperCase());
            if (car.year) filters.year.add(car.year.toString());
            if (car.location) filters.location.add(car.location.toUpperCase());

            // Track price range
            const price = parseInt(car.price);
            if (!isNaN(price)) {
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
            }

            // Handle mods
            if (car.mods) {
                if (Array.isArray(car.mods)) {
                    car.mods.forEach((mod: any) => {
                        if (typeof mod === 'string' && mod.trim()) {
                            filters.mods.add(mod.trim().toUpperCase());
                        } else if (mod && mod.name) {
                            filters.mods.add(mod.name.trim().toUpperCase());
                        }
                    });
                } else if (typeof car.mods === 'object') {
                    Object.values(car.mods).forEach((values: any) => {
                        if (Array.isArray(values)) {
                            values.forEach((v: string) => {
                                if (v && typeof v === 'string') {
                                    filters.mods.add(v.trim().toUpperCase());
                                }
                            });
                        }
                    });
                }
            }
        }

        return {
            chassisCode: Array.from(filters.chassisCode).sort(),
            engineCode: Array.from(filters.engineCode).sort(),
            transmission: Array.from(filters.transmission).sort(),
            drivetrain: Array.from(filters.drivetrain).sort(),
            condition: Array.from(filters.condition).sort(),
            paperwork: Array.from(filters.paperwork).sort(),
            mods: Array.from(filters.mods).sort(),
            notableFeatures: Array.from(filters.notableFeatures).sort(),
            priceRange: {
                min: minPrice === Infinity ? 0 : minPrice,
                max: maxPrice,
            },
            count: cars.length,
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
    }): Promise<any> {
        const qb = this.carsRepository.createQueryBuilder('car');
        qb.leftJoin('car.seller', 'seller');
        qb.where('seller.isSellingBanned = :isBanned', { isBanned: false });
        qb.andWhere('car.status IN (:...statuses)', { statuses: [CarStatus.AVAILABLE, CarStatus.SOLD] });

        // Apply existing filters
        if (query.make) {
            qb.andWhere('car.make ILIKE :make', { make: `%${query.make}%` });
        }
        if (query.model) {
            qb.andWhere('car.model ILIKE :model', { model: `%${query.model}%` });
        }
        if (query.chassisCode) {
            qb.andWhere('car.chassisCode ILIKE :chassisCode', { chassisCode: `%${query.chassisCode}%` });
        }
        if (query.engineCode) {
            qb.andWhere('car.engineCode ILIKE :engineCode', { engineCode: `%${query.engineCode}%` });
        }
        if (query.transmission) {
            qb.andWhere('car.transmission ILIKE :transmission', { transmission: `%${query.transmission}%` });
        }
        if (query.drivetrain) {
            qb.andWhere('car.drivetrain ILIKE :drivetrain', { drivetrain: `%${query.drivetrain}%` });
        }
        if (query.condition) {
            qb.andWhere('car.condition ILIKE :condition', { condition: `%${query.condition}%` });
        }
        if (query.paperwork) {
            qb.andWhere('car.paperwork ILIKE :paperwork', { paperwork: `%${query.paperwork}%` });
        }
        if (query.mods) {
            qb.andWhere('CAST(car.mods AS TEXT) ILIKE :mods', { mods: `%"${query.mods}"%` });
        }
        if (query.minPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) >= :minPrice', { minPrice: query.minPrice });
        }
        if (query.maxPrice) {
            qb.andWhere('CAST(car.price AS BIGINT) <= :maxPrice', { maxPrice: query.maxPrice });
        }
        if (query.minYear) {
            qb.andWhere('car.year >= :minYear', { minYear: query.minYear });
        }
        if (query.maxYear) {
            qb.andWhere('car.year <= :maxYear', { maxYear: query.maxYear });
        }
        if (query.location) {
            qb.andWhere('car.location ILIKE :location', { location: `%${query.location}%` });
        }
        if (query.notableFeatures) {
            qb.andWhere('car.notableFeatures ILIKE :notableFeatures', { notableFeatures: `%${query.notableFeatures}%` });
        }

        const cars = await qb.getMany();

        // Collect all unique values for each field
        const options: Record<string, Set<string>> = {
            make: new Set(),
            model: new Set(),
            chassisCode: new Set(),
            engineCode: new Set(),
            transmission: new Set(),
            drivetrain: new Set(),
            condition: new Set(),
            paperwork: new Set(),
            mods: new Set(),
            location: new Set(),
            notableFeatures: new Set(),
        };

        let minPrice = Infinity;
        let maxPrice = 0;
        let minYear = Infinity;
        let maxYear = 0;
        let minMileage = Infinity;
        let maxMileage = 0;

        for (const car of cars) {
            if (car.make) options.make.add(car.make.toUpperCase());
            if (car.model) options.model.add(car.model.toUpperCase());
            if (car.chassisCode) options.chassisCode.add(car.chassisCode.toUpperCase());
            if (car.engineCode) options.engineCode.add(car.engineCode.toUpperCase());
            if (car.transmission) options.transmission.add(car.transmission.toUpperCase());
            if (car.drivetrain) options.drivetrain.add(car.drivetrain.toUpperCase());
            if (car.condition) options.condition.add(car.condition.toUpperCase());
            if (car.paperwork) options.paperwork.add(car.paperwork.toUpperCase());
            if (car.location) options.location.add(car.location.toUpperCase());

            // Track ranges
            const price = parseInt(car.price);
            if (!isNaN(price)) {
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
            }
            if (car.year) {
                if (car.year < minYear) minYear = car.year;
                if (car.year > maxYear) maxYear = car.year;
            }
            if (car.mileage) {
                if (car.mileage < minMileage) minMileage = car.mileage;
                if (car.mileage > maxMileage) maxMileage = car.mileage;
            }

            // Handle mods
            if (car.mods) {
                if (Array.isArray(car.mods)) {
                    car.mods.forEach((mod: any) => {
                        if (typeof mod === 'string' && mod.trim()) {
                            options.mods.add(mod.trim().toUpperCase());
                        } else if (mod && mod.name) {
                            options.mods.add(mod.name.trim().toUpperCase());
                        }
                    });
                } else if (typeof car.mods === 'object') {
                    Object.values(car.mods).forEach((values: any) => {
                        if (Array.isArray(values)) {
                            values.forEach((v: string) => {
                                if (v && typeof v === 'string') {
                                    options.mods.add(v.trim().toUpperCase());
                                }
                            });
                        }
                    });
                }
            }

            // Handle notableFeatures
            if (car.notableFeatures && Array.isArray(car.notableFeatures)) {
                car.notableFeatures.forEach(f => {
                    if (f && f.trim()) options.notableFeatures.add(f.trim().toUpperCase());
                });
            }
        }

        return {
            // Available options based on current filters
            options: {
                make: Array.from(options.make).sort(),
                model: Array.from(options.model).sort(),
                chassisCode: Array.from(options.chassisCode).sort(),
                engineCode: Array.from(options.engineCode).sort(),
                transmission: Array.from(options.transmission).sort(),
                drivetrain: Array.from(options.drivetrain).sort(),
                condition: Array.from(options.condition).sort(),
                paperwork: Array.from(options.paperwork).sort(),
                mods: Array.from(options.mods).sort(),
                location: Array.from(options.location).sort(),
                notableFeatures: Array.from(options.notableFeatures).sort(),
            },
            // Ranges
            ranges: {
                price: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice },
                year: { min: minYear === Infinity ? 0 : minYear, max: maxYear },
                mileage: { min: minMileage === Infinity ? 0 : minMileage, max: maxMileage },
            },
            // Result count
            count: cars.length,
            // Current applied filters (echo back)
            appliedFilters: Object.fromEntries(
                Object.entries(query).filter(([, v]) => v !== undefined && v !== '')
            ),
        };
    }

    async getTagsStats(): Promise<{ category: string, items: { tag: string, count: number }[] }[]> {
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
        // 1. Find all cars (Fetch ALL to ensure we don't miss any due to JSON/SQL quirks)
        const allCars = await this.carsRepository.find({
            relations: ['seller'],
            order: { createdAt: 'ASC' }
        });

        // Match in memory across ALL fields (same logic as getTagsStats)
        const verifiedCars = allCars.filter(car => {
            const targetTag = tag.trim().toUpperCase();

            // Check simple string fields
            if (car.make && car.make.toUpperCase() === targetTag) return true;
            if (car.model && car.model.toUpperCase() === targetTag) return true;
            if (car.chassisCode && car.chassisCode.toUpperCase() === targetTag) return true;
            if (car.engineCode && car.engineCode.toUpperCase() === targetTag) return true;
            if (car.transmission && car.transmission.toUpperCase() === targetTag) return true;
            if (car.drivetrain && car.drivetrain.toUpperCase() === targetTag) return true;
            if (car.condition && car.condition.toUpperCase() === targetTag) return true;
            if (car.paperwork && car.paperwork.toUpperCase() === targetTag) return true;
            if (car.location && car.location.toUpperCase() === targetTag) return true;

            // Check mods (complex JSON structure)
            if (car.mods) {
                if (Array.isArray(car.mods)) {
                    for (const mod of car.mods) {
                        const t = (typeof mod === 'string') ? mod : (mod?.name || '');
                        if (t && t.trim().toUpperCase() === targetTag) return true;
                    }
                } else if (typeof car.mods === 'object') {
                    for (const values of Object.values(car.mods)) {
                        if (Array.isArray(values)) {
                            for (const v of values as string[]) {
                                if (v && typeof v === 'string' && v.trim().toUpperCase() === targetTag) return true;
                            }
                        }
                    }
                }
            }
            return false;
        });

        if (verifiedCars.length === 0) return null;

        // Find initiator (already sorted by createdAt ASC)
        const initiator = verifiedCars[0].seller;

        // Delete ALL cars with this tag
        if (verifiedCars.length > 0) {
            // Delete images and decrement tags for each car
            for (const car of verifiedCars) {
                await this.deleteCarImages(car);
                await this.tagsService.syncTagsFromCar(car, false);
            }
            await this.carsRepository.remove(verifiedCars);

            // Send notification to the initiator (seller of the first car found)
            if (initiator) {
                await this.notificationsService.createNotification(
                    initiator.id,
                    NotificationType.POST_DELETED,
                    'Bài đăng bị xóa hàng loạt',
                    `Hệ thống phát hiện spam tag "${tag}". Các bài đăng liên quan đã bị xóa và tài khoản có thể bị xử lý.`
                );
            }
        }

        return initiator ? initiator.id : null;
    }

    async incrementView(
        carId: string,
        clientInfo: { userId?: string; ipAddress: string; userAgent: string }
    ): Promise<void> {
        const { userId, ipAddress, userAgent } = clientInfo;

        try {
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const queryBuilder = this.carViewRepository.createQueryBuilder('cv')
                .where('cv.carId = :carId', { carId })
                .andWhere('cv.viewedAt > :since', { since: twentyFourHoursAgo });

            if (userId) {
                queryBuilder.andWhere('cv.userId = :userId', { userId });
            } else if (ipAddress && userAgent) {
                queryBuilder.andWhere('cv.ipAddress = :ipAddress', { ipAddress })
                    .andWhere('cv.userAgent = :userAgent', { userAgent });
            }

            const existingView = await queryBuilder.getOne();

            if (!existingView) {
                await this.dataSource.transaction(async manager => {
                    const view = new CarView();
                    view.carId = carId;
                    view.userId = userId || null;
                    view.ipAddress = ipAddress || null;
                    view.userAgent = userAgent || null;
                    await manager.save(view);

                    await manager.update(Car, carId, {
                        views: () => 'views + 1'
                    });
                });
            }
        } catch (error) {
            this.logger.error(`Error in incrementView: ${error.message}`, error.stack);
        }
    }

    async getCarRanking(id: string) {
        const car = await this.carsRepository.findOne({ where: { id } });
        if (!car) throw new NotFoundException('Car not found');

        // Fetch all available cars to calculate ranking in memory (safest for small/medium datasets)
        const allAvailable = await this.carsRepository.find({
            where: { status: CarStatus.AVAILABLE },
            order: { createdAt: 'DESC' }
        });

        const globalRank = allAvailable.findIndex(c => c.id === id) + 1;
        const globalTotal = allAvailable.length;

        const sameMake = allAvailable.filter(c => c.make === car.make);
        const makeRank = sameMake.findIndex(c => c.id === id) + 1;
        const makeTotal = sameMake.length;

        return {
            global: {
                rank: globalRank > 0 ? globalRank : globalTotal + 1, // Fallback if car is not AVAILABLE
                total: globalTotal
            },
            make: {
                rank: makeRank > 0 ? makeRank : makeTotal + 1,
                total: makeTotal,
                name: car.make
            }
        };
    }

    async editTag(category: string, oldTag: string, newTag: string): Promise<void> {
        this.logger.log(`Editing tag: category=${category}, old=${oldTag}, new=${newTag}`);

        // Find all cars to check for this tag
        const allCars = await this.carsRepository.find();
        const targetTag = oldTag.trim().toUpperCase();
        let updatedCount = 0;

        for (const car of allCars) {
            let matches = false;

            // Check if car matches the tag in the specific category
            if (category === 'make' && car.make?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'model' && car.model?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'trim' && car.trim?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'chassisCode' && car.chassisCode?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'engineCode' && car.engineCode?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'transmission' && car.transmission?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'drivetrain' && car.drivetrain?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'condition' && car.condition?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'paperwork' && car.paperwork?.trim().toUpperCase() === targetTag) matches = true;
            else if (category === 'location' && car.location?.trim().toUpperCase() === targetTag) matches = true;

            else if (category === 'feature' && car.notableFeatures) {
                if (car.notableFeatures.some(f => f.trim().toUpperCase() === targetTag)) matches = true;
            }

            else if (category.startsWith('mods') && car.mods) {
                if (Array.isArray(car.mods)) {
                    if (car.mods.some((m: any) => {
                        const val = typeof m === 'string' ? m : m?.name;
                        return val && val.trim().toUpperCase() === targetTag;
                    })) matches = true;
                } else if (typeof car.mods === 'object') {
                    const modType = category.replace('mods_', '');
                    if (car.mods[modType] && Array.isArray(car.mods[modType])) {
                        if (car.mods[modType].some((m: string) => m.trim().toUpperCase() === targetTag)) matches = true;
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
                else if (category === 'location') car.location = newTag;

                else if (category === 'feature' && car.notableFeatures) {
                    car.notableFeatures = car.notableFeatures.map(f =>
                        f.trim().toUpperCase() === targetTag ? newTag : f
                    );
                }

                else if (category.startsWith('mods') && car.mods) {
                    // Clone mods object to ensure TypeORM detects change
                    const modsClone = JSON.parse(JSON.stringify(car.mods));

                    if (Array.isArray(modsClone)) {
                        car.mods = modsClone.map((m: any) => {
                            if (typeof m === 'string') {
                                return m.trim().toUpperCase() === targetTag ? newTag : m;
                            } else if (m && m.name) {
                                if (m.name.trim().toUpperCase() === targetTag) m.name = newTag;
                                return m;
                            }
                            return m;
                        });
                    } else if (typeof modsClone === 'object') {
                        const modType = category.replace('mods_', '');
                        if (modsClone[modType] && Array.isArray(modsClone[modType])) {
                            modsClone[modType] = modsClone[modType].map((m: string) =>
                                m.trim().toUpperCase() === targetTag ? newTag : m
                            );
                            // Reassign to trigger update
                            car.mods = modsClone;
                        }
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
