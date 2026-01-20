import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async createPaymentLink(@Body() body: { amount: number }, @Req() req) {
    // userId from JWT
    const userId = req.user.id || req.user.userId || req.user.sub;

    try {
      const result = await this.paymentService.createPaymentLink(
        body.amount,
        userId,
      );
      return {
        error: 0,
        message: 'Success',
        data: result,
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
        data: null,
      };
    } catch (error) {
      console.error(error);
      return {
        error: -1,
        message: error.message,
        data: null,
      };
    }
  }
}
