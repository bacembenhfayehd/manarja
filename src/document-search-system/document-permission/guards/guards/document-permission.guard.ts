import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentPermissionsService } from '../services/document-permissions.service';
import { PermissionType } from '../enums';

@Injectable()
export class DocumentPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: DocumentPermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<PermissionType>('permission', context.getHandler());
    
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const documentId = request.params?.documentId || request.body?.documentId;

    if (!userId || !documentId) {
      throw new ForbiddenException('User or document not specified');
    }

    const hasPermission = await this.permissionsService.checkPermission({
      documentId,
      userId,
      permission: requiredPermission
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient document permissions');
    }

    return true;
  }
}