import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/project/create-project.dto';
import { UpdateProjectDto } from '../dto/project/update-project.dto';
import { ProjectStatus, ProjectType, ProjectMemberRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
  const project = await this.prisma.project.create({
    data: {
      name: createProjectDto.name,
      description: createProjectDto.description,
      type: createProjectDto.type,
      clientId: createProjectDto.clientId,
      companyId: createProjectDto.companyId,
      status: createProjectDto.status,
      startDate: createProjectDto.startDate,
      endDate: createProjectDto.endDate,
      budget: createProjectDto.budget,
      managerId: userId,
      members: {
        create: {
          userId: userId,
          role: ProjectMemberRole.MANAGER,
        },
      },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return project;
}

  async findAll(filters: any, pagination: any) {
    const { status, type, companyId, managerId, userId } = filters;
    const { page, limit } = pagination;

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (companyId) where.companyId = companyId;
    if (managerId) where.managerId = managerId;

    
    if (userId) {
      where.members = {
        some: {
          userId: userId,
        },
      };
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findByCompany(companyId: string, userId: string) {
    
    const userCompany = await this.prisma.userCompany.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
      },
    });

    if (!userCompany) {
      throw new ForbiddenException('Access denied to this company projects');
    }

    return this.prisma.project.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string,userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findOneWithDetails(id: string,userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
         tasks: {
          include: {
            
            project: {
              include: {
                members: {
                  where: {
                    userId: {
                      equals: userId
                    }
                  },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findProjectMembers(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project.members;
  }

  async findProjectTasks(id: string, filters: any, userId?: string) {
    
    if (userId) {
      await this.findOne(id, userId);
    }

    const where: any = { projectId: id };
    
    if (filters.status) where.status = filters.status;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    return this.prisma.task.findMany({
      where,
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: filters.assignedTo || undefined
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findProjectMilestones(id: string, userId?: string) {
    
    if (userId) {
      await this.findOne(id, userId);
    }

    return this.prisma.milestone.findMany({
      where: { projectId: id },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getProjectProgress(id: string) {
    const [project, tasksStats, milestonesStats] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId: id },
        _count: {
          id: true,
        },
      }),
      this.prisma.milestone.groupBy({
        by: ['status'],
        where: { projectId: id },
        _count: {
          id: true,
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const totalTasks = tasksStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedTasks = tasksStats.find(stat => stat.status === 'COMPLETED')?._count.id || 0;
    const totalMilestones = milestonesStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedMilestones = milestonesStats.find(stat => stat.status === 'COMPLETED')?._count.id || 0;

    return {
      project,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        byStatus: tasksStats,
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        percentage: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        byStatus: milestonesStats,
      },
    };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const isManager = project.managerId === userId;
    const isMember = project.members.some(member => 
      member.userId === userId && member.role === ProjectMemberRole.MANAGER
    );

    if (!isManager && !isMember) {
      throw new ForbiddenException('Insufficient permissions to update this project');
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: ProjectStatus, userId: string) {
    return this.update(id, { status }, userId);
  }

  async addMember(id: string, userId: string, role: ProjectMemberRole, currentUserId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const isManager = project.managerId === currentUserId;
    const isMember = project.members.some(member => 
      member.userId === currentUserId && member.role === ProjectMemberRole.MANAGER
    );

    if (!isManager && !isMember) {
      throw new ForbiddenException('Insufficient permissions to add members');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userId,
        role: role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(id: string, userId: string, currentUserId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

   
    const isManager = project.managerId === currentUserId;
    const isMember = project.members.some(member => 
      member.userId === currentUserId && member.role === ProjectMemberRole.MANAGER
    );

    if (!isManager && !isMember) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    return this.prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.managerId !== userId) {
      throw new ForbiddenException('Only project manager can delete the project');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async archive(id: string, userId: string) {
    return this.updateStatus(id, ProjectStatus.ARCHIVED, userId);
  }

  async restore(id: string, userId: string) {
    return this.updateStatus(id, ProjectStatus.ACTIVE, userId);
  }
}