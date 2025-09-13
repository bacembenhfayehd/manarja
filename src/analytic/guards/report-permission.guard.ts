import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException,
  NotFoundException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REPORT_ACCESS_KEY, ReportAccessLevel } from '../decorators/report-access.decorator';

@Injectable()
export class ReportPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLevels = this.reflector.getAllAndOverride<ReportAccessLevel[]>(
      REPORT_ACCESS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredLevels) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const reportId = request.params?.id || request.params?.reportId;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // If no specific report ID, check general analytics permissions
    if (!reportId) {
      return this.checkGeneralPermissions(user, requiredLevels);
    }

    // Check specific report permissions
    return await this.checkReportPermissions(user, reportId, requiredLevels);
  }

  private async checkReportPermissions(
    user: any, 
    reportId: string | number, 
    requiredLevels: ReportAccessLevel[]
  ): Promise<boolean> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: Number(reportId) },
        include: {
          user: true
        }
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      // Owner has all permissions
      if (report.userId === user.id) {
        return true;
      }

      // Check if user has admin role (if you have role-based access)
      if (user.role === 'ADMIN') {
        return true;
      }

      // For shared reports, check specific permissions
      // This assumes you have a report sharing mechanism
      const hasSharedAccess = await this.checkSharedReportAccess(
        user.id, 
        Number(reportId), 
        requiredLevels
      );

      if (hasSharedAccess) {
        return true;
      }

      // Check project-level permissions
      // If report belongs to a project, check if user has access to that project
      if (report.filters) {
        const filters = JSON.parse(report.filters);
        if (filters.projectId) {
          const hasProjectAccess = await this.checkProjectAccess(
            user.id, 
            filters.projectId
          );
          
          if (hasProjectAccess) {
            // Allow READ access if user has project access
            return requiredLevels.includes(ReportAccessLevel.READ);
          }
        }
      }

      throw new ForbiddenException('Insufficient permissions to access this report');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Permission check failed');
    }
  }

  private checkGeneralPermissions(user: any, requiredLevels: ReportAccessLevel[]): boolean {
    // Check if user has general analytics permissions
    // This could be role-based or feature-based
    
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check user permissions/subscriptions
    const userPermissions = user.permissions || [];
    
    if (requiredLevels.includes(ReportAccessLevel.ADMIN)) {
      return userPermissions.includes('ANALYTICS_ADMIN');
    }

    if (requiredLevels.includes(ReportAccessLevel.WRITE)) {
      return userPermissions.includes('ANALYTICS_WRITE') || 
             userPermissions.includes('ANALYTICS_ADMIN');
    }

    if (requiredLevels.includes(ReportAccessLevel.READ)) {
      return userPermissions.includes('ANALYTICS_READ') || 
             userPermissions.includes('ANALYTICS_WRITE') || 
             userPermissions.includes('ANALYTICS_ADMIN');
    }

    return true; // Default allow for basic access
  }

  private async checkSharedReportAccess(
    userId: number, 
    reportId: number, 
    requiredLevels: ReportAccessLevel[]
  ): Promise<boolean> {
    // This assumes you have a report sharing table
    // You might implement this based on your sharing requirements
    
    /* Example implementation:
    const sharedAccess = await this.prisma.reportShare.findFirst({
      where: {
        reportId,
        userId,
        permissions: {
          hasSome: requiredLevels
        }
      }
    });
    
    return !!sharedAccess;
    */
    
    return false; // No sharing mechanism implemented yet
  }

  private async checkProjectAccess(userId: number, projectId: number): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId }, // User owns the project
          { 
            // User is assigned to tasks in the project
            tasks: {
              some: {
                assigneeId: userId
              }
            }
          }
        ]
      }
    });

    return !!project;
  }
}
