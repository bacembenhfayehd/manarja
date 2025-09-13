import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ContactType, ContactStatus } from '@prisma/client';

export class UpdateContactDto {
  @IsEnum(ContactType)
  @IsOptional()
  contactType?: ContactType;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  addresses?: any;

  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsOptional()
  customFields?: any;
}