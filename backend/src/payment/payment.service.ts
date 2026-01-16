import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
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

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        // Check balance (assuming balance is stored as string in DB due to bigint)
        const currentBalance = Number(user.balance);
        if (currentBalance < amount) {
            throw new Error('Số dư không đủ');
        }

        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100));

        // Create Payout
        const payoutData = {
            amount: amount,
            description: `Rut tien ${orderCode}`,
            referenceId: String(orderCode),
            toBin: bankBin,
            toAccountNumber: accountNumber,
        };

        // Deduct balance immediately (hold)
        user.balance = String(currentBalance - amount);
        await this.userRepository.save(user);

        try {
            await this.payOSPayout.payouts.create(payoutData);

            // Save transaction
            const transaction = this.transactionRepository.create({
                orderCode: orderCode,
                userId: userId,
                amount: amount,
                type: 'WITHDRAW',
                status: 'SUCCESS', // Assuming instant success for now, or use webhook for Payouts too?
                // PayOS Payouts are usually async, but for simplicity we mark as PENDING or SUCCESS.
                // The type definition showed `PayoutTransactionState`.
                // For now, let's treat as SUCCESS if no error thrown by `create`.
                bankBin,
                accountNumber,
                accountName
            });
            await this.transactionRepository.save(transaction);

            return { message: 'Withdrawal successful' };
        } catch (error) {
            // Refund on failure
            user.balance = String(Number(user.balance) + amount);
            await this.userRepository.save(user);
            throw error;
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
}
