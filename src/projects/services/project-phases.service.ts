import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectPhaseDto } from '../dto/phase/create-project-phase.dto';
import { UpdateProjectPhaseDto } from '../dto/phase/update-project-phase.dto';
import { MilestoneStatus, Prisma } from '@prisma/client';

@Injectable()
export class ProjectPhasesService {
  constructor(private prisma: PrismaService) {}

 async create(projectId: string, createProjectPhaseDto: CreateProjectPhaseDto, userId: string) {
  await this.checkProjectAccess(projectId, userId);

  const milestone = await this.prisma.milestone.create({
    data: {
      name: createProjectPhaseDto.name,
      description: createProjectPhaseDto.description ?? undefined,
      projectId,
      dueDate: new Date(), 
      status: MilestoneStatus.PENDING,
      percentageComplete: new Prisma.Decimal(0), 
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return milestone;
}


  async findAll(projectId: string, filters: any, sorting: any) {
    const where: any = { projectId };
    
    if (filters.status) where.status = filters.status;

    const orderBy: any = {};
    if (sorting.sortBy) {
      orderBy[sorting.sortBy] = sorting.sortOrder;
    }

    return this.prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy,
    });
  }

  async findUpcoming(projectId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.milestone.findMany({
      where: {
        projectId,
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
        status: {
          in: [MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findOverdue(projectId: string) {
    return this.prisma.milestone.findMany({
      where: {
        projectId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          in: [MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getProjectProgress(projectId: string) {
    const [milestones, project] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          status: true,
          percentageComplete: true,
          dueDate: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
    const overdueMilestones = milestones.filter(m => 
      m.status !== MilestoneStatus.COMPLETED && m.dueDate < new Date()
    ).length;

    const averageProgress = totalMilestones > 0 
      ? milestones.reduce((sum, m) => sum + Number(m.percentageComplete), 0) / totalMilestones
      : 0;

    return {
      project,
      summary: {
        totalMilestones,
        completedMilestones,
        overdueMilestones,
        averageProgress: Math.round(averageProgress),
        completionPercentage: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      },
      milestones,
    };
  }

  async findOne(projectId: string, id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async findPhaseTasks(phaseId: string, filters: any) {
    const where: any = { 
  
      milestoneId: phaseId 
    };
    
    if (filters.status) where.status = filters.status;

    return this.prisma.task.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(projectId: string, id: string, updateProjectPhaseDto: UpdateProjectPhaseDto, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return this.prisma.milestone.update({
      where: { id },
      data: updateProjectPhaseDto,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(projectId: string, id: string, status: MilestoneStatus, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const updateData: any = { status };
  
    if (status === MilestoneStatus.COMPLETED) {
      updateData.percentageComplete = 100;
    }

    return this.prisma.milestone.update({
      where: { id },
      data: updateData,
    });
  }

  async updateProgress(projectId: string, id: string, percentageComplete: number, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const updateData: any = { percentageComplete };
    
    if (percentageComplete === 100) {
      updateData.status = MilestoneStatus.COMPLETED;
    } else if (percentageComplete > 0) {
      updateData.status = MilestoneStatus.IN_PROGRESS;
    }

    return this.prisma.milestone.update({
      where: { id },
      data: updateData,
    });
  }

  async complete(projectId: string, id: string, userId: string) {
    return this.updateStatus(projectId, id, MilestoneStatus.COMPLETED, userId);
  }

  async reopen(projectId: string, id: string, userId: string) {
    return this.updateStatus(projectId, id, MilestoneStatus.IN_PROGRESS, userId);
  }

  async remove(projectId: string, id: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return this.prisma.milestone.delete({
      where: { id },
    });
  }

  async reorder(projectId: string, phaseIds: string[], userId: string) {
    await this.checkProjectAccess(projectId, userId);


    const phases = await this.prisma.milestone.findMany({
      where: {
        id: { in: phaseIds },
        projectId,
      },
    });

    if (phases.length !== phaseIds.length) {
      throw new NotFoundException('Some phases not found');
    }

    const updatePromises = phaseIds.map((phaseId, index) =>
      this.prisma.milestone.update({
        where: { id: phaseId },
        data: {
          order: index + 1,
        },
      })
    );

    await Promise.all(updatePromises);

    return { message: 'Phases reordered successfully' };
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMember) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { managerId: true },
      });

      if (!project || project.managerId !== userId) {
        throw new ForbiddenException('Access denied to this project');
      }
    }
  }
}