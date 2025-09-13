import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectTemplateDto } from '../dto/template/create-project-template.dto';
import { UpdateProjectTemplateDto } from '../dto/template/update-project-template.dto';
import { ProjectType } from '@prisma/client';

@Injectable()
export class ProjectTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProjectTemplateDto: CreateProjectTemplateDto,
    userId: string,
  ) {
    const { name, description, type, isPublic, companyId, phases } =
      createProjectTemplateDto;

    
    if (companyId) {
      const companyMember = await this.prisma.userCompany.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!companyMember) {
        throw new ForbiddenException('You do not have access to this company');
      }
    }

    
    const data: any = {
      name,
      description,
      type,
      isPublic: isPublic ?? false,
      createdBy: userId,
    };

    if (companyId) {
      data.company = {
        connect: { id: companyId },
      };
    }

    if (phases && phases.length > 0) {
      data.phases = {
        create: phases.map((phase) => ({
          name: phase.name,
          description: phase.description,
          order: phase.order,
          tasks:
            phase.tasks?.map((task) => ({
              title: task.title,
              description: task.description,
              priority: task.priority,
              estimatedHours: task.estimatedHours,
              order: task.order,
            })) || [],
        })),
      };
    }

    
    return this.prisma.projectTemplate.create({
      data,
      include: {
        phases: {
          include: {
            tasks: true,
          },
        },
      },
    });
  }

  async findAll(filters: any, pagination: any) {
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.userId)
      where.OR = [
        { createdBy: filters.userId },
        { isPublic: true },
        { companyId: { not: null } }, 
      ];
    if (filters.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    const [templates, total] = await Promise.all([
      this.prisma.projectTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              projectsCreated: true,
            },
          },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.projectTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findPublicTemplates(filters: any, pagination: any) {
    const where: any = { isPublic: true };

    if (filters.type) where.type = filters.type;

    const [templates, total] = await Promise.all([
      this.prisma.projectTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              projectsCreated: true,
            },
          },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.projectTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findUserTemplates(userId: string) {
    return this.prisma.projectTemplate.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        _count: {
          select: {
            projectsCreated: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findCompanyTemplates(companyId: string, userId: string) {
    
    const companyMember = await this.prisma.userCompany.findFirst({
      where: {
        companyId,
        userId,
      },
    });

    if (!companyMember) {
      throw new ForbiddenException('You do not have access to this company');
    }

    return this.prisma.projectTemplate.findMany({
      where: {
        companyId,
      },
      include: {
        _count: {
          select: {
            projectsCreated: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByType(
    type: ProjectType,
    companyId: string | undefined,
    userId: string,
  ) {
    const where: any = { type };

    if (companyId) {
      
      const companyMember = await this.prisma.userCompany.findFirst({
        where: {
          companyId,
          userId,
        },
      });

      if (!companyMember) {
        throw new ForbiddenException('You do not have access to this company');
      }

      where.companyId = companyId;
    } else {
      
      where.OR = [{ createdBy: userId }, { isPublic: true }];
    }

    return this.prisma.projectTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            projectsCreated: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            tasks: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            projectsCreated: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

   
    if (template.createdBy !== userId && !template.isPublic) {
      if (template.companyId) {
        const companyMember = await this.prisma.userCompany.findFirst({
          where: {
            companyId: template.companyId,
            userId,
          },
        });

        if (!companyMember) {
          throw new ForbiddenException(
            'You do not have access to this template',
          );
        }
      } else {
        throw new ForbiddenException('You do not have access to this template');
      }
    }

    return template;
  }

  async getTemplatePreview(id: string, userId: string) {
    const template = await this.findOne(id, userId);

    return {
      ...template,
      phases: template.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
        })),
      })),
    };
  }

  async getTemplatePhases(id: string, userId: string) {
    const template = await this.findOne(id, userId);
    return template.phases;
  }

  async getTemplateTasks(id: string, userId: string) {
    const template = await this.findOne(id, userId);
    return template.phases.flatMap((phase) => phase.tasks);
  }

  async createProjectFromTemplate(
    id: string,
    projectData: any,
    userId: string,
  ) {
    const template = await this.findOne(id, userId);

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        createdBy: userId,
        templateId: template.id,
      },
    });

 
    for (const phase of template.phases) {
      const newPhase = await this.prisma.projectPhase.create({
        data: {
          projectId: project.id,
          name: phase.name,
          description: phase.description,
          order: phase.order,
        },
      });

      for (const task of phase.tasks) {
        await this.prisma.task.create({
          data: {
            projectId: project.id,
            phaseId: newPhase.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'TODO',
            estimatedHours: task.estimatedHours,
          },
        });
      }
    }

   
    await this.prisma.projectTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return project;
  }

  async duplicateTemplate(id: string, userId: string) {
    const template = await this.findOne(id, userId);

    
    const newTemplate = await this.prisma.projectTemplate.create({
      data: {
        name: `Copy of ${template.name}`,
        description: template.description,
        type: template.type,
        isPublic: false,
        createdBy: userId,
        companyId: template.companyId,
      },
    });

    
    for (const phase of template.phases) {
      const newPhase = await this.prisma.templatePhase.create({
        data: {
          templateId: newTemplate.id,
          name: phase.name,
          description: phase.description,
          order: phase.order,
        },
      });

      for (const task of phase.tasks) {
        await this.prisma.templateTask.create({
          data: {
            phaseId: newPhase.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
          },
        });
      }
    }

    return newTemplate;
  }

  async createFromProject(
    projectId: string,
    templateData: CreateProjectTemplateDto,
    userId: string,
  ) {
    
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const data: any = {
      name: templateData.name,
      description: templateData.description,
      type: templateData.type,
      isPublic: templateData.isPublic ?? false,
      createdBy: userId,
    };

    if (templateData.companyId) {
      data.company = {
        connect: { id: templateData.companyId },
      };
    }

    
    const template = await this.prisma.projectTemplate.create({ data });


    for (const phase of project.phases) {
      const newPhase = await this.prisma.templatePhase.create({
        data: {
          templateId: template.id,
          name: phase.name,
          description: phase.description,
          order: phase.order,
        },
      });

      for (const task of phase.tasks) {
        await this.prisma.templateTask.create({
          data: {
            phaseId: newPhase.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            
          },
        });
      }
    }

    return template;
  }

  async update(
    id: string,
    updateProjectTemplateDto: UpdateProjectTemplateDto,
    userId: string,
  ) {
    const template = await this.findOne(id, userId);

    if (template.createdBy !== userId) {
      throw new ForbiddenException('Only the template creator can update it');
    }

    
    const data: any = {};

    if (updateProjectTemplateDto.name !== undefined) {
      data.name = updateProjectTemplateDto.name;
    }
    if (updateProjectTemplateDto.description !== undefined) {
      data.description = updateProjectTemplateDto.description;
    }
    if (updateProjectTemplateDto.type !== undefined) {
      data.type = updateProjectTemplateDto.type;
    }
    if (updateProjectTemplateDto.isPublic !== undefined) {
      data.isPublic = updateProjectTemplateDto.isPublic;
    }
    if (updateProjectTemplateDto.companyId !== undefined) {
      data.company = { connect: { id: updateProjectTemplateDto.companyId } };
    }

    return this.prisma.projectTemplate.update({
      where: { id },
      data,
    });
  }

  async publish(id: string, userId: string) {
    const template = await this.findOne(id, userId);

    
    if (template.createdBy !== userId) {
      throw new ForbiddenException('Only the template creator can publish it');
    }

    return this.prisma.projectTemplate.update({
      where: { id },
      data: { isPublic: true },
    });
  }

  async unpublish(id: string, userId: string) {
    const template = await this.findOne(id, userId);

   
    if (template.createdBy !== userId) {
      throw new ForbiddenException(
        'Only the template creator can unpublish it',
      );
    }

    return this.prisma.projectTemplate.update({
      where: { id },
      data: { isPublic: false },
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.findOne(id, userId);

    
    if (template.createdBy !== userId) {
      throw new ForbiddenException('Only the template creator can delete it');
    }

   
    const usageCount = await this.prisma.project.count({
      where: { templateId: id },
    });

    if (usageCount > 0) {
      throw new ForbiddenException('Cannot delete template that has been used');
    }

    return this.prisma.projectTemplate.delete({
      where: { id },
    });
  }

  async getUsageStats(templateId?: string) {
    if (templateId) {
      const usageCount = await this.prisma.project.count({
        where: { templateId },
      });

      return {
        templateId,
        usageCount,
      };
    }

    
    const templates = await this.prisma.projectTemplate.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            projectsCreated: true,
          },
        },
      },
      orderBy: {
        projectsCreated: {
          _count: 'desc',
        },
      },
    });

    return templates.map((t) => ({
      templateId: t.id,
      templateName: t.name,
      usageCount: t._count.projectsCreated,
    }));
  }
}
