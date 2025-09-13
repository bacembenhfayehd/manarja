import { IsUUID, IsEnum } from 'class-validator';
import { PermissionType } from '../enums/permission-type.enum';

export class PermissionCheckDto {
  @IsUUID()
  documentId: string;

  @IsUUID()
  userId: string;

  @IsEnum(PermissionType)
  permission: PermissionType;
}