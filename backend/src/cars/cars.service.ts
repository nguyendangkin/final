import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Car, CarStatus } from './entities/car.entity';
import { CreateCarDto, UpdateCarDto } from './dto/create-car.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CarsService {
    constructor(
        @InjectRepository(Car)
        private carsRepository: Repository<Car>,
        private dataSource: DataSource,
    ) { }

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
            qb.andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN });
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

        // Sắp xếp bài mới nhất lên trên
        qb.orderBy('car.createdAt', 'DESC');

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
        const car = this.carsRepository.create({
            ...createCarDto,
            seller,
            price: createCarDto.price.toString(),
        });
        return this.carsRepository.save(car);
    }

    async update(id: string, updateCarDto: UpdateCarDto, user: User): Promise<Car> {
        const car = await this.findOne(id);
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only update your own listings');
        }

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
        return this.carsRepository.save(car);
    }

    async toggleHide(id: string): Promise<Car> {
        const car = await this.carsRepository.findOne({ where: { id } });
        if (!car) throw new NotFoundException('Car not found');

        if (car.status === CarStatus.HIDDEN) {
            car.status = CarStatus.AVAILABLE; // Default back to available
        } else {
            car.status = CarStatus.HIDDEN;
        }

        return this.carsRepository.save(car);
    }

    async forceHide(id: string): Promise<Car> {
        const car = await this.carsRepository.findOne({ where: { id } });
        if (!car) throw new NotFoundException('Car not found');
        car.status = CarStatus.HIDDEN;
        return this.carsRepository.save(car);
    }

    async remove(id: string, user: User): Promise<void> {
        const car = await this.findOne(id);
        if (car.seller.id !== user.id) {
            throw new BadRequestException('You can only delete your own listings');
        }
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

    async getBrands(): Promise<string[]> {
        const brands = await this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.seller', 'seller')
            .select('DISTINCT car.make', 'make')
            .where('car.status = :status', { status: CarStatus.AVAILABLE })
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
            .andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN })
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
            .andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN })
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
            .andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN })
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
            .andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN });

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
    }): Promise<any> {
        const qb = this.carsRepository.createQueryBuilder('car');
        qb.leftJoin('car.seller', 'seller');
        qb.where('seller.isSellingBanned = :isBanned', { isBanned: false });
        qb.andWhere('car.status != :hiddenStatus', { hiddenStatus: CarStatus.HIDDEN });

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
}
