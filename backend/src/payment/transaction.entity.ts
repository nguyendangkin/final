import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  orderCode: number; // PayOS order code

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number; // The amount user gets

  @Column({ default: 'PENDING' })
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
