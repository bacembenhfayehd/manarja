import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../enums/permission-type.enum';


export const RequirePermission = (permission: PermissionType) => SetMetadata('permission', permission);
