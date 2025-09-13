// dto/subscription.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString, IsDecimal } from 'class-validator';
import { SubscriptionStatus, PaymentProvider } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  planId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  providerSubscriptionId?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  providerSubscriptionId?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsDateString()
  trialEnd?: string;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsDecimal()
  unitAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  metadata?: any;
}