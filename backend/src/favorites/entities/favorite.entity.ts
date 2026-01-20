import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { Car } from '../../cars/entities/car.entity';

@Entity()
@Unique(['user', 'car']) // Prevent duplicate favorites
export class Favorite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: User;

    @ManyToOne(() => Car, (car) => car.favorites, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carId' })
    @Index()
    car: Car;

    @CreateDateColumn()
    createdAt: Date;
}
