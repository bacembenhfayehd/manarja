import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ShareDocumentDto } from '../dto';
import { AccessLevel, PermissionType } from '../enums';

@Injectable()
export class DocumentSharesService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: DocumentPermissionsService
  ) {}

  async shareDocument(dto: ShareDocumentDto, sharerId: string) {
    // Vérifier que l'utilisateur peut partager le document
    const sharerAccess = await this.permissionsService.getUserDocumentAccess(dto.documentId, sharerId);
    if (!sharerAccess.canShare && !sharerAccess.canAdmin) {
      throw new ForbiddenException('You cannot share this document');
    }

    // Trouver l'utilisateur par email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    // Mapper AccessLevel vers permissions
    const permissions = this.mapAccessLevelToPermissions(dto.accessLevel);

    // Créer ou mettre à jour la permission
    const permission = await this.prisma.documentPermission.upsert({
      where: {
        documentId_userId: {
          documentId: dto.documentId,
          userId: targetUser.id
        }
      },
      create: {
        documentId: dto.documentId,
        userId: targetUser.id,
        permissions,
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt,
        sharedBy: sharerId
      },
      update: {
        permissions,
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt,
        updatedAt: new Date()
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        document: { select: { id: true, title: true } }
      }
    });

    return permission;
  }

  private mapAccessLevelToPermissions(level: AccessLevel): PermissionType[] {
    switch (level) {
      case AccessLevel.READ:
        return [PermissionType.READ];
      case AccessLevel.WRITE:
        return [PermissionType.READ, PermissionType.WRITE];
      case AccessLevel.ADMIN:
        return [PermissionType.READ, PermissionType.WRITE, PermissionType.DELETE, PermissionType.SHARE, PermissionType.ADMIN];
      default:
        return [];
    }
  }

  async getSharedDocuments(userId: string) {
    return this.prisma.documentPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
