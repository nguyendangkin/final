import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Car } from '../cars/entities/car.entity';
import { Favorite } from '../favorites/entities/favorite.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    googleId: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ default: false })
    isAdmin: boolean;

    @Column({ default: false })
    isSellingBanned: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'bigint', default: 0 })
    balance: string; // TypeORM maps bigint to string in JS because it can exceed Number.MAX_SAFE_INTEGER

    @OneToMany(() => Car, (car) => car.seller)
    carsForSale: Car[];

    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];
}
