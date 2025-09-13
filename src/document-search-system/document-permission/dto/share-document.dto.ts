import { IsUUID, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AccessLevel } from '../enums/acess-level.enum';


export class ShareDocumentDto {
  @IsUUID()
  documentId: string;

  @IsEmail()
  email: string;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  expiresAt?: Date;
}
