import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export enum NotificationType {
    ACCOUNT_BAN = 'ACCOUNT_BAN',
    ACCOUNT_UNBAN = 'ACCOUNT_UNBAN',
    POST_DELETED = 'POST_DELETED',
    POST_APPROVED = 'POST_APPROVED',
    POST_REJECTED = 'POST_REJECTED',
    GENERAL = 'GENERAL',
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.GENERAL,
    })
    type: NotificationType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
