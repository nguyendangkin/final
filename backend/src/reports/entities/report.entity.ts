import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';
import { Car } from '../../cars/entities/car.entity';

export enum ReportReason {
    SENSITIVE = 'SENSITIVE',
    IRRELEVANT = 'IRRELEVANT',
    SPAM = 'SPAM',
    OTHER = 'OTHER'
}

export enum ReportStatus {
    PENDING = 'PENDING',
    IGNORED = 'IGNORED',
    RESOLVED = 'RESOLVED'
}

@Entity()
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ReportReason
    })
    reason: ReportReason;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING
    })
    status: ReportStatus;

    @ManyToOne(() => User, { eager: true })
    reporter: User;

    @ManyToOne(() => Car, { eager: true })
    reportedCar: Car;

    @CreateDateColumn()
    createdAt: Date;
}
