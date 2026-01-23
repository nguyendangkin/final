import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  @Index()
  orderCode: number; // PayOS order code

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number; // The amount user gets

  @Column({ default: 'PENDING' })
  @Index()
  status: string;

  @Column({ default: 'DEPOSIT' })
  type: string; // DEPOSIT | WITHDRAW

  @Column({ nullable: true })
  bankBin: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  accountName: string;

  @CreateDateColumn()
  createdAt: Date;
}
