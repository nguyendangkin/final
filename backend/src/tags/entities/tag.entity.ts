import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity()
@Unique(['category', 'value', 'parent'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  category: string; // 'make', 'model', 'chassisCode', 'engineCode', 'transmission', 'drivetrain', 'condition', 'paperwork', 'location', 'mods', 'trim'

  @Column()
  @Index()
  value: string; // Normalized uppercase value

  @Column({ default: '' })
  parent: string; // The parent tag value (e.g. Make for Model, Model for ChassisCode)

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
