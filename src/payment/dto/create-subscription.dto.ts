import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider.enum';

export class CreateSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @IsString()
  @IsOptional()
  currency?: string = 'EUR';

  @IsOptional()
  metadata?: Record<string, any>;
}
