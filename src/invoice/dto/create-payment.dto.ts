import { IsString, IsDecimal, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaymentMethod } from '../types/invoice.types';

export class CreatePaymentDto {
  @IsString()
  invoiceId: string;

  @IsDecimal()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  gatewayData?: any;

  @IsDateString()
  paymentDate: string;
}
