import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class UpdateSubscriptionDto {
  @IsUUID()
  @IsOptional()
  planId?: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}