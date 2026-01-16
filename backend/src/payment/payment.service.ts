import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class PaymentService {
    private payOS: PayOS;
    private payOSPayout: PayOS;
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        private dataSource: DataSource
    ) {
        this.payOS = new PayOS({
            clientId: this.configService.get<string>('PAYOS_CLIENT_ID'),
            apiKey: this.configService.get<string>('PAYOS_API_KEY'),
            checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
        });

        // Initialize Payout PayOS instance
        // Check if config exists to avoid errors if not configured yet
        const payoutClientId = this.configService.get<string>('PAYOS_PAYOUT_CLIENT_ID');
        if (payoutClientId) {
            this.payOSPayout = new PayOS({
                clientId: payoutClientId,
                apiKey: this.configService.get<string>('PAYOS_PAYOUT_API_KEY'),
                checksumKey: this.configService.get<string>('PAYOS_PAYOUT_CHECKSUM_KEY'),
            });
        }
    }

    async createPaymentLink(amount: number, userId: string, description: string = 'Nap tien') {
        if (amount < 2000) {
            throw new Error('Số tiền nạp tối thiểu là 2000 VNĐ');
        }

        const fee = 2000;
        const totalAmount = amount + fee;
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100)); // Ensure unique

        const paymentLinkData = {
            orderCode: orderCode,
            amount: totalAmount,
            description: `${description}`.substring(0, 25),
            cancelUrl: 'http://localhost:3001/?status=cancelled',
            returnUrl: 'http://localhost:3001/?status=success',
            items: [
                {
                    name: "Nạp tiền tài khoản",
                    quantity: 1,
                    price: amount
                },
                {
                    name: "Phí giao dịch",
                    quantity: 1,
                    price: fee
                }
            ]
        };

        const paymentLink = await this.payOS.paymentRequests.create(paymentLinkData);

        // Save pending transaction
        const transaction = this.transactionRepository.create({
            orderCode: orderCode,
            userId: userId,
            amount: amount, // Save the actual amount user gets
            status: 'PENDING'
        });
        await this.transactionRepository.save(transaction);

        return paymentLink;
    }


    async createWithdrawal(amount: number, userId: string, bankBin: string, accountNumber: string, accountName: string) {
        if (!this.payOSPayout) {
            throw new Error('Hệ thống rút tiền chưa được cấu hình (Thiếu Payout Keys)');
        }

        if (amount < 2000) {
            throw new Error('Số tiền rút tối thiểu là 2000 VNĐ');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock user row for update to prevent race conditions
            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId },
                lock: { mode: 'pessimistic_write' }
            });

            if (!user) throw new Error('User not found');

            const currentBalance = Number(user.balance);
            if (currentBalance < amount) {
                throw new Error('Số dư không đủ');
            }

            // Deduct balance
            user.balance = String(currentBalance - amount);
            await queryRunner.manager.save(user);

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        // Proceed with PayOS logic OUTSIDE the DB transaction to avoid holding locks
        // If PayOS fails, we must refund
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100));
        const payoutData = {
            amount: amount,
            description: `Rut tien ${orderCode}`,
            referenceId: String(orderCode),
            toBin: bankBin,
            toAccountNumber: accountNumber,
        };

        try {
            const payoutResult = await this.payOSPayout.payouts.create(payoutData);
            this.logger.log(`Payout Result: ${JSON.stringify(payoutResult)}`);

            if (!payoutResult || !payoutResult.transactions || payoutResult.transactions.length === 0) {
                throw new Error('Payout creation failed: No transaction returned');
            }

            const transactionState = payoutResult.transactions[0].state;
            if (transactionState === 'FAILED' || transactionState === 'REVERSED' || transactionState === 'CANCELLED') {
                throw new Error(`Payout failed with state: ${transactionState}`);
            }

            const transaction = this.transactionRepository.create({
                orderCode: orderCode,
                userId: userId,
                amount: amount,
                type: 'WITHDRAW',
                status: transactionState === 'SUCCEEDED' ? 'SUCCESS' : 'PENDING',
                bankBin,
                accountNumber,
                accountName
            });
            await this.transactionRepository.save(transaction);

            return {
                message: 'Withdrawal initiated',
                data: payoutResult
            };

        } catch (error) {
            // Refund on failure (New Transaction)
            this.logger.error('Payout failed, refunding user...', error);
            const refundRunner = this.dataSource.createQueryRunner();
            await refundRunner.connect();
            await refundRunner.startTransaction();
            try {
                const user = await refundRunner.manager.findOne(User, {
                    where: { id: userId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (user) {
                    user.balance = String(Number(user.balance) + amount); // Refund
                    await refundRunner.manager.save(user);
                }
                await refundRunner.commitTransaction();
            } catch (refundError) {
                this.logger.error('CRITICAL: Refund failed!', refundError);
                await refundRunner.rollbackTransaction();
                // In production, this should alert admin immediately
            } finally {
                await refundRunner.release();
            }
            throw new Error(error.message || 'Withdrawal failed and refunded');
        }
    }

    async handleWebhook(webhookData: any) {
        const verifyData = await this.payOS.webhooks.verify(webhookData);

        const { orderCode, amount } = verifyData;
        // Note: 'amount' here is totalAmount (including fee)

        const transaction = await this.transactionRepository.findOne({ where: { orderCode } });
        if (!transaction) {
            this.logger.error(`Transaction not found for orderCode: ${orderCode}`);
            return;
        }

        if (transaction.status === 'SUCCESS') {
            return; // Already processed
        }

        // Update Transaction
        transaction.status = 'SUCCESS';
        await this.transactionRepository.save(transaction);

        // Update User Balance
        const user = await this.userRepository.findOne({ where: { id: transaction.userId } });
        if (user) {
            // Parse balance as BigInt, add, then save back
            // Note: user.balance is string in entity
            const currentBalance = BigInt(user.balance || 0);
            const addAmount = BigInt(transaction.amount);
            user.balance = (currentBalance + addAmount).toString();
            await this.userRepository.save(user);
            this.logger.log(`User ${user.id} balance updated. Added ${addAmount}`);
        }

        return { success: true };
    }
    async getBanks() {
        try {
            const response = await fetch('https://api.vietqr.io/v2/banks');
            const data = await response.json();
            return data;
        } catch (error) {
            this.logger.error('Failed to fetch banks', error);
            throw error;
        }
    }
}
