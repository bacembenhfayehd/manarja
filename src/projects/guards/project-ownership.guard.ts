import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessLevel } from '../decorators/project-access.decorator';

@Injectable()
export class ProjectOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAccess = this.reflector.get<ProjectAccessLevel>(
      'projectAccess',
      context.getHandler(),
    ) || ProjectAccessLevel.MEMBER;

    const request = context.switchToHttp().getRequest();
    const projectId = request.params.projectId;
    const userId = request.user.id;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        },
        company: {
          select: {
            userCompanies: {
              where: { userId },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    
    const projectMember = project.members[0];
    if (projectMember) {
      return this.checkAccessLevel(projectMember.role, requiredAccess);
    }

    if (project.companyId) {
      const companyMember = project.company.userCompanies[0];
      if (companyMember) {
        return this.checkAccessLevel(companyMember.role, requiredAccess);
      }
    }

    throw new ForbiddenException('You do not have access to this project');
  }

  private checkAccessLevel(
    userRole: string, 
    requiredAccess: ProjectAccessLevel
  ): boolean {
    const roleHierarchy = {
      [ProjectAccessLevel.VIEWER]: ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'],
      [ProjectAccessLevel.MEMBER]: ['MEMBER', 'ADMIN', 'OWNER'],
      [ProjectAccessLevel.ADMIN]: ['ADMIN', 'OWNER'],
      [ProjectAccessLevel.OWNER]: ['OWNER']
    };

    return roleHierarchy[requiredAccess].includes(userRole);
  }
}