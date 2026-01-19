import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { User } from '../../users/user.entity';
import { SystemAnnouncement } from './system-announcement.entity';

@Entity()
@Unique(['userId', 'announcementId'])
export class UserAnnouncementRead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => SystemAnnouncement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'announcementId' })
    announcement: SystemAnnouncement;

    @Column()
    announcementId: string;

    @CreateDateColumn()
    readAt: Date;
}
