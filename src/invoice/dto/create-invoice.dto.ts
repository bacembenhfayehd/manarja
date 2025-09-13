import { IsString, IsOptional, IsDecimal, IsDateString, IsArray, ValidateNested, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../types/invoice.types';


export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsDecimal()
  quantity: number;

  @IsDecimal()
  unitPrice: number;

  @IsDecimal()
  totalPrice: number;

  @IsString()
  unitType: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class CreateInvoiceDto {
  @IsString()
  projectId: string;

  @IsString()
  clientId: string;

  @IsString()
  invoiceNumber: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDecimal()
  subtotal: number;

  @IsDecimal()
  taxAmount: number;

  @IsDecimal()
  totalAmount: number;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus = InvoiceStatus.DRAFT;

  @IsDateString()
  dueDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}