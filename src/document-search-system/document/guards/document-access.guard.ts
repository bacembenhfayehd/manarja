
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class DocumentAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const documentId = request.params?.id || request.params?.documentId;
    
    if (!documentId) {
      return true; 
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: {
          include: {
            members: { where: { userId: user.id } }
          }
        }
      }
    });

    if (!document) {
      throw new ForbiddenException('Document not found');
    }

    
    if (document.userId === user.id) {
      return true;
    }

   
    if (document.isPublic) {
      return true;
    }

  
    if (document.project?.members.length > 0) {
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}