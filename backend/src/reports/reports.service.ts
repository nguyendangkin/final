import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from '../users/user.entity';
import { Car } from '../cars/entities/car.entity';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        private dataSource: DataSource,
        private carsService: CarsService,
    ) { }

    async create(createReportDto: CreateReportDto, reporter: User): Promise<Report> {
        let report = await this.reportsRepository.findOne({
            where: {
                reporter: { id: reporter.id },
                reportedCar: { id: createReportDto.carId }
            }
        });

        if (report) {
            report.reason = createReportDto.reason;
            report.status = ReportStatus.PENDING;
            report.createdAt = new Date(); // Update timestamp to bring to top
            return this.reportsRepository.save(report);
        }

        report = this.reportsRepository.create({
            ...createReportDto,
            reporter: { id: reporter.id } as User,
            reportedCar: { id: createReportDto.carId } as Car,
        });
        return this.reportsRepository.save(report);
    }

    async findAll(query: any): Promise<{ data: Report[], meta: any }> {
        const page = query.page ? parseInt(query.page) : 1;
        const limit = query.limit ? parseInt(query.limit) : 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.status) {
            if (query.status === 'PROCESSED') {
                where.status = In([ReportStatus.RESOLVED, ReportStatus.IGNORED]);
            } else {
                where.status = query.status;
            }
        }

        const [reports, total] = await this.reportsRepository.findAndCount({
            where,
            relations: ['reporter', 'reportedCar', 'reportedCar.seller'],
            order: { createdAt: query.status === 'PROCESSED' ? 'DESC' : 'ASC' },
            skip,
            take: limit,
        });

        return {
            data: reports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async ignore(id: string): Promise<Report> {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report) throw new NotFoundException('Report not found');

        report.status = ReportStatus.IGNORED;
        return this.reportsRepository.save(report);
    }

    async resolve(id: string): Promise<void> {
        const report = await this.reportsRepository.findOne({ where: { id }, relations: ['reportedCar'] });
        if (!report) throw new NotFoundException('Report not found');

        const carId = report.reportedCar.id;

        // Delete the car
        await this.carsService.forceDelete(carId);


    }
}
