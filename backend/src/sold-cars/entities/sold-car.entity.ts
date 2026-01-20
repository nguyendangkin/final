import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class SoldCar {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    originalCarId: string; // The ID of the original car listing (for reference)

    @Column()
    make: string;

    @Column()
    model: string;

    @Column()
    year: number;

    @Column()
    price: string;

    @Column({ nullable: true })
    thumbnail: string;

    @ManyToOne(() => User, (user) => user.soldCars, { eager: true })
    seller: User;

    @CreateDateColumn()
    soldAt: Date;
}
