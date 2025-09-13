import { PartialType } from '@nestjs/mapped-types';
import { CreateEstimateDto } from './create-estimate.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export class UpdateEstimateDto extends PartialType(CreateEstimateDto) {
  @IsOptional()
  @IsEnum(EstimateStatus)
  status?: EstimateStatus;
}