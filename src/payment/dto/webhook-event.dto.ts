import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider.enum';

export class WebhookEventDto {
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsNotEmpty()
  providerEventId: string;

  @IsNotEmpty()
  data: any;
}