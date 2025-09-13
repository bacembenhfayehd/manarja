import { IsUUID, IsArray, IsEnum, IsOptional } from 'class-validator';
import { PermissionType } from '../enums/permission-type.enum';
import { AccessLevel } from '../enums/acess-level.enum';


export class CreatePermissionDto {
  @IsUUID()
  documentId: string;

  @IsUUID()
  userId: string;

  @IsArray()
  @IsEnum(PermissionType, { each: true })
  permissions: PermissionType[];

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

  @IsOptional()
  expiresAt?: Date;
}
