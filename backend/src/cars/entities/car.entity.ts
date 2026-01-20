import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';

export enum CarStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  HIDDEN = 'HIDDEN',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  REJECTED = 'REJECTED',
}

@Entity()
@Index(['make', 'model']) // Compound index for make+model search
@Index(['status', 'createdAt']) // For sorting and filtering by status
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  make: string;

  @Column()
  @Index()
  model: string;

  @Column()
  @Index() // Range queries on year
  year: number;

  @Column({ nullable: true })
  trim: string;

  @Column({ type: 'bigint' })
  @Index() // Range queries on price
  price: string; // TypeORM handles bigint as string

  @Column({ default: false })
  isNegotiable: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array')
  images: string[];

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ nullable: true })
  videoLink: string;

  @Column()
  mileage: number; // Stored as number, equivalent to ODO

  @Column({ default: 'VN' })
  location: string;

  // JDM Specifics
  @Column({ nullable: true })
  @Index()
  chassisCode: string;

  @Column({ nullable: true })
  @Index()
  engineCode: string;

  @Column({ nullable: true })
  @Index()
  transmission: string; // MT, AT, CVT

  @Column({ nullable: true })
  @Index()
  drivetrain: string; // FWD, RWD, AWD

  @Column({ nullable: true })
  @Index()
  condition: string;

  @Column({ default: '' })
  phoneNumber: string;

  @Column({ nullable: true })
  facebookLink: string;

  @Column({ nullable: true })
  zaloLink: string;

  @Column({ type: 'text', nullable: true })
  additionalInfo: string;

  // Legal
  @Column({ nullable: true })
  @Index()
  paperwork: string;

  @Column({ nullable: true })
  registryExpiry: string; // Added this field

  @Column({ default: false })
  noRegistry: boolean; // Flag for "Không đăng kiểm được"

  @Column({ nullable: true })
  @Index() // Good for admin search or check
  plateNumber: string;

  @Column('simple-array', { nullable: true })
  notableFeatures: string[];

  @Column('jsonb', { nullable: true })
  @Index()
  mods: any;

  @Column({
    type: 'enum',
    enum: CarStatus,
    default: CarStatus.AVAILABLE,
  })
  @Index()
  status: CarStatus;

  @ManyToOne(() => User, (user) => user.carsForSale)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToMany(() => Favorite, (favorite) => favorite.car)
  favorites: Favorite[];

  @Column({ nullable: true })
  @Index()
  sellerId: string;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('simple-array', { nullable: true })
  editHistory: string[]; // Array of ISO date strings for edit history
}
