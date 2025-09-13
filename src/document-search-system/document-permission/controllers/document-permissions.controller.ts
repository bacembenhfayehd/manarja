import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { DocumentPermissionsService } from '../services/document-permissions.service';
import { CreatePermissionDto, PermissionCheckDto } from '../dto';
import { DocumentPermissionGuard } from '../guards/document-permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionType } from '../enums';

@Controller('document-permissions')
@UseGuards(JwtAuthGuard)
export class DocumentPermissionsController {
  constructor(private permissionsService: DocumentPermissionsService) {}

  @Post()
  @UseGuards(DocumentPermissionGuard)
  @RequirePermission(PermissionType.ADMIN)
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @Get(':documentId')
  @UseGuards(DocumentPermissionGuard)
  @RequirePermission(PermissionType.READ)
  async getDocumentPermissions(@Param('documentId') documentId: string) {
    return this.permissionsService.getDocumentPermissions(documentId);
  }

  @Post('check')
  async checkPermission(@Body() dto: PermissionCheckDto) {
    const hasPermission = await this.permissionsService.checkPermission(dto);
    return { hasPermission };
  }

  @Get(':documentId/access')
  async getUserAccess(
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.permissionsService.getUserDocumentAccess(documentId, userId);
  }

  @Delete(':documentId/users/:userId')
  @UseGuards(DocumentPermissionGuard)
  @RequirePermission(PermissionType.ADMIN)
  async removePermission(
    @Param('documentId') documentId: string,
    @Param('userId') userId: string,
    @CurrentUser('id') requesterId: string
  ) {
    return this.permissionsService.removePermission(documentId, userId, requesterId);
  }
}