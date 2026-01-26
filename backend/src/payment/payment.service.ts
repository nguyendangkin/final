import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';

// Maximum payment limit (100 million VND)
const MAX_PAYMENT_AMOUNT = 100_000_000;
const MIN_PAYMENT_AMOUNT = 2000;
const TRANSACTION_FEE = 2000;

@Injectable()
export class PaymentService {
  private payOS: PayOS;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {
    this.payOS = new PayOS({
      clientId: this.configService.get<string>('PAYOS_CLIENT_ID'),
      apiKey: this.configService.get<string>('PAYOS_API_KEY'),
      checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
    });
  }

  async createPaymentLink(
    amount: number,
    userId: string,
    description: string = 'Nap tien',
  ) {
    // Validate amount
    if (amount < MIN_PAYMENT_AMOUNT) {
      throw new BadRequestException(`Số tiền nạp tối thiểu là ${MIN_PAYMENT_AMOUNT.toLocaleString('vi-VN')} VNĐ`);
    }

    if (amount > MAX_PAYMENT_AMOUNT) {
      throw new BadRequestException(`Số tiền nạp tối đa là ${MAX_PAYMENT_AMOUNT.toLocaleString('vi-VN')} VNĐ`);
    }

    const totalAmount = amount + TRANSACTION_FEE;

    // Use full timestamp + random to ensure uniqueness/entropy
    // Max Safe Integer is 9007199254740991 (16 digits). Date.now() is 13 digits.
    // We can append 3 random digits safely.
    const orderCode = Number(
      `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    );

    const paymentLinkData = {
      orderCode: orderCode,
      amount: totalAmount,
      description: `${description}`.substring(0, 25),
      cancelUrl: `${this.configService.get<string>('FRONTEND_URL')}/?status=cancelled`,
      returnUrl: `${this.configService.get<string>('FRONTEND_URL')}/?status=success`,
      items: [
        {
          name: 'Nạp tiền tài khoản',
          quantity: 1,
          price: amount,
        },
        {
          name: 'Phí giao dịch',
          quantity: 1,
          price: TRANSACTION_FEE,
        },
      ],
    };

    const paymentLink =
      await this.payOS.paymentRequests.create(paymentLinkData);

    // Save pending transaction
    const transaction = this.transactionRepository.create({
      orderCode: orderCode,
      userId: userId,
      amount: amount, // Save the actual amount user gets
      status: 'PENDING',
    });
    await this.transactionRepository.save(transaction);

    return paymentLink;
  }

  async handleWebhook(webhookData: any) {
    const verifyData = await this.payOS.webhooks.verify(webhookData);

    const { orderCode, amount } = verifyData;
    // Note: 'amount' here is totalAmount (including fee)

    // Use a transaction to prevent race conditions on double-webhook events
    return this.dataSource.transaction(async (manager) => {
      // Lock the transaction row to prevent concurrent updates
      // In TypeORM, we can use setLock('pessimistic_write') if we use query builder or findOne with lock
      const transaction = await manager.getRepository(Transaction).findOne({
        where: { orderCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found for orderCode: ${orderCode}`);
        return;
      }

      if (transaction.status === 'SUCCESS') {
        return; // Already processed
      }

      // Update Transaction
      transaction.status = 'SUCCESS';
      await manager.save(transaction);

      // Update User Balance
      const user = await manager
        .getRepository(User)
        .findOne({ where: { id: transaction.userId } });
      if (user) {
        // Parse balance as BigInt, add, then save back
        const currentBalance = BigInt(user.balance || 0);
        const addAmount = BigInt(transaction.amount);
        user.balance = (currentBalance + addAmount).toString();
        await manager.save(user);
        this.logger.log(`User ${user.id} balance updated. Added ${addAmount}`);
      }
    });

    return { success: true };
  }
}
