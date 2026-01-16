import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    orderCode: number; // PayOS order code

    @Column()
    userId: string;

    @Column({ type: 'int' })
    amount: number; // The amount user gets

    @Column({ default: 'PENDING' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;
}
