import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ContactType, ContactStatus } from '@prisma/client';

export class CreateContactDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsEnum(ContactType)
  contactType: ContactType;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  addresses?: any;

  @IsEnum(ContactStatus)
  status: ContactStatus;

  @IsOptional()
  customFields?: any;
}