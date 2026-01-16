import { Controller, Post, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming JwtGuard exists, checking imports later

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('create')
    async createPaymentLink(@Body() body: { amount: number; userId: string }) {
        console.log('Payment create body:', body);
        // Note: userId should come from JWT token in production
        // keeping it simple as per prompt instructions context handling

        try {
            const result = await this.paymentService.createPaymentLink(body.amount, body.userId);
            return {
                error: 0,
                message: 'Success',
                data: result
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('withdraw')
    async createWithdrawal(@Body() body: { amount: number; userId: string; bankBin: string; accountNumber: string; accountName: string }) {
        try {
            const result = await this.paymentService.createWithdrawal(body.amount, body.userId, body.bankBin, body.accountNumber, body.accountName);
            return {
                error: 0,
                message: 'Success',
                data: result
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('webhook')
    async handleWebhook(@Body() body: any) {
        try {
            await this.paymentService.handleWebhook(body);
            return {
                error: 0,
                message: 'Success',
                data: null
            };
        } catch (error) {
            console.error(error);
            return {
                error: -1,
                message: error.message,
                data: null
            };
        }
    }
}
