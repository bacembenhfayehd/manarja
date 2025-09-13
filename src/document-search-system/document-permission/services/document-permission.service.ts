import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePermissionDto, ShareDocumentDto, PermissionCheckDto } from '../dto';
import { PermissionType, AccessLevel } from '../enums';
import { IDocumentAccess } from '../interfaces';

@Injectable()
export class DocumentPermissionsService {
  constructor(private prisma: PrismaService) {}

  async createPermission(dto: CreatePermissionDto) {
    return this.prisma.documentPermission.create({
      data: {
        documentId: dto.documentId,
        userId: dto.userId,
        permissions: dto.permissions,
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        document: { select: { id: true, title: true } }
      }
    });
  }

  async checkPermission(dto: PermissionCheckDto): Promise<boolean> {
    const permission = await this.prisma.documentPermission.findFirst({
      where: {
        documentId: dto.documentId,
        userId: dto.userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    if (!permission) return false;
    
    return permission.permissions.includes(dto.permission);
  }

  async getUserDocumentAccess(documentId: string, userId: string): Promise<IDocumentAccess> {
    const permission = await this.prisma.documentPermission.findFirst({
      where: {
        documentId,
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    if (!permission) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canShare: false,
        canAdmin: false
      };
    }

    const perms = permission.permissions;
    return {
      canRead: perms.includes(PermissionType.READ),
      canWrite: perms.includes(PermissionType.WRITE),
      canDelete: perms.includes(PermissionType.DELETE),
      canShare: perms.includes(PermissionType.SHARE),
      canAdmin: perms.includes(PermissionType.ADMIN)
    };
  }

  async getDocumentPermissions(documentId: string) {
    return this.prisma.documentPermission.findMany({
      where: { 
        documentId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async removePermission(documentId: string, userId: string, requesterId: string) {
    // Vérifier que le demandeur a les droits admin
    const requesterAccess = await this.getUserDocumentAccess(documentId, requesterId);
    if (!requesterAccess.canAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.documentPermission.delete({
      where: {
        documentId_userId: {
          documentId,
          userId
        }
      }
    });
  }
}