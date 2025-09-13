import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';



import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTimesheetDto } from '../dto/create-timesheet.dto';
import { TimesheetStatus } from '@prisma/client';
import { ApproveTimesheetDto } from '../dto/approve-timesheet';

@Injectable()
export class TimesheetService {
  constructor(private prisma: PrismaService) {}

  async create(createTimesheetDto: CreateTimesheetDto) {
    const { userId, weekStart, weekEnd } = createTimesheetDto;

    
    const existingTimesheet = await this.prisma.timesheet.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: new Date(weekStart),
        },
      },
    });

    if (existingTimesheet) {
      throw new BadRequestException('existed timesheet for this weekend');
    }

   
    const totalHours = await this.calculateTotalHours(userId, weekStart, weekEnd);

    return this.prisma.timesheet.create({
      data: {
        userId,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        totalHours: new Decimal(totalHours),
        status: TimesheetStatus.DRAFT,
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
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(filters?: {
    userId?: string;
    status?: TimesheetStatus;
    weekStart?: string;
    weekEnd?: string;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.weekStart || filters?.weekEnd) {
      where.AND = [];
      
      if (filters.weekStart) {
        where.AND.push({
          weekStart: {
            gte: new Date(filters.weekStart),
          },
        });
      }

      if (filters.weekEnd) {
        where.AND.push({
          weekEnd: {
            lte: new Date(filters.weekEnd),
          },
        });
      }
    }

    return this.prisma.timesheet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
    });
  }

  async findByUser(userId: string, filters?: {
    status?: TimesheetStatus;
    weekStart?: string;
    weekEnd?: string;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.weekStart || filters?.weekEnd) {
      where.AND = [];
      
      if (filters.weekStart) {
        where.AND.push({
          weekStart: {
            gte: new Date(filters.weekStart),
          },
        });
      }

      if (filters.weekEnd) {
        where.AND.push({
          weekEnd: {
            lte: new Date(filters.weekEnd),
          },
        });
      }
    }

    return this.prisma.timesheet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
    });
  }

  async getCurrentWeekTimesheet(userId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);

    return this.prisma.timesheet.findFirst({
      where: {
        userId,
        weekStart: {
          gte: startOfWeek,
        },
        weekEnd: {
          lte: endOfWeek,
        },
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
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });
  }

  async getPendingApproval(filters?: {
    userId?: string;
    weekStart?: string;
    weekEnd?: string;
  }) {
    const where: any = {
      status: TimesheetStatus.SUBMITTED,
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.weekStart || filters?.weekEnd) {
      where.AND = [];
      
      if (filters.weekStart) {
        where.AND.push({
          weekStart: {
            gte: new Date(filters.weekStart),
          },
        });
      }

      if (filters.weekEnd) {
        where.AND.push({
          weekEnd: {
            lte: new Date(filters.weekEnd),
          },
        });
      }
    }

    return this.prisma.timesheet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundException(`Timesheet with l'ID ${id} not found`);
    }

    return timesheet;
  }

  async findByUserAndWeek(userId: string, weekStart: string) {
    return this.prisma.timesheet.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: new Date(weekStart),
        },
      },
      include: {
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });
  }

  async submit(id: string) {
    const timesheet = await this.findOne(id);

   
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      throw new BadRequestException('Seuls les timesheets en mode brouillon peuvent être soumis');
    }

   
    if (!timesheet.timeEntries || timesheet.timeEntries.length === 0) {
      throw new BadRequestException('Impossible de soumettre un timesheet sans entrées de temps');
    }

   
    const totalHours = await this.calculateTotalHours(
      timesheet.userId,
      timesheet.weekStart.toISOString(),
      timesheet.weekEnd.toISOString()
    );

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.SUBMITTED,
        submittedAt: new Date(),
        totalHours: new Decimal(totalHours),
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
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async approve(id: string, approveTimesheetDto: ApproveTimesheetDto) {
    const { approverId, comments } = approveTimesheetDto;
    const timesheet = await this.findOne(id);

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Seuls les timesheets soumis peuvent être approuvés');
    }

 
    if (timesheet.userId === approverId) {
      throw new ForbiddenException('Vous ne pouvez pas approuver votre propre timesheet');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: approverId,
        comments: comments || null,
      
        rejectedAt: null,
        rejectedBy: null,
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
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async reject(id: string, rejectedBy: string, comments?: string) {
    const timesheet = await this.findOne(id);

    
    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Seuls les timesheets soumis peuvent être rejetés');
    }

   
    if (timesheet.userId === rejectedBy) {
      throw new ForbiddenException('Vous ne pouvez pas rejeter votre propre timesheet');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy,
        comments: comments || null,
      
        approvedAt: null,
        approvedBy: null,
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
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async reopen(id: string) {
    const timesheet = await this.findOne(id);

   
    if (timesheet.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException('Seuls les timesheets rejetés peuvent être rouverts');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.DRAFT,
        
        submittedAt: null,
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
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateData: { comments?: string }) {
    const timesheet = await this.findOne(id);

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        comments: updateData.comments,
        updatedAt: new Date(),
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
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const timesheet = await this.findOne(id);

    
    if (timesheet.status === TimesheetStatus.APPROVED) {
      throw new BadRequestException('Impossible de supprimer un timesheet approuvé');
    }

    return this.prisma.timesheet.delete({
      where: { id },
    });
  }

  async addTimeEntries(timesheetId: string, timeEntryIds: string[]) {
    const timesheet = await this.findOne(timesheetId);

    
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      throw new BadRequestException('Impossible d\'ajouter des entrées à un timesheet non-brouillon');
    }

    
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        userId: timesheet.userId,
        startTime: {
          gte: timesheet.weekStart,
          lte: timesheet.weekEnd,
        },
      },
    });

    if (timeEntries.length !== timeEntryIds.length) {
      throw new BadRequestException('Certaines entrées de temps sont invalides ou n\'appartiennent pas à la bonne période');
    }

  
    await this.prisma.timeEntry.updateMany({
      where: {
        id: { in: timeEntryIds },
      },
      data: {
       
         timesheetId: timesheetId,
      },
    });

    
    await this.updateTotalHours(timesheetId);

    return this.findOne(timesheetId);
  }

  async removeTimeEntry(timesheetId: string, timeEntryId: string) {
    const timesheet = await this.findOne(timesheetId);

    
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      throw new BadRequestException('Impossible de modifier un timesheet non-brouillon');
    }

    const timeEntry = await this.prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        userId: timesheet.userId,
        startTime: {
          gte: timesheet.weekStart,
          lte: timesheet.weekEnd,
        },
      },
    });

    if (!timeEntry) {
      throw new NotFoundException('Entrée de temps non trouvée dans ce timesheet');
    }

   
    await this.prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        
         timesheetId: null,
      },
    });

   
    await this.updateTotalHours(timesheetId);

    return this.findOne(timesheetId);
  }

  async getTimesheetSummary(id: string) {
    const timesheet = await this.findOne(id);

    
    const projectStats = await this.prisma.timeEntry.groupBy({
      by: ['projectId'],
      where: {
        userId: timesheet.userId,
        startTime: {
          gte: timesheet.weekStart,
          lte: timesheet.weekEnd,
        },
      },
      _sum: {
        hours: true,
      },
      _count: {
        id: true,
      },
    });

    
    const projectsData = await Promise.all(
      projectStats.map(async (stat) => {
        const project = await this.prisma.project.findUnique({
          where: { id: stat.projectId },
          select: { id: true, name: true },
        });
        return {
          project,
          totalHours: stat._sum.hours || 0,
          entriesCount: stat._count.id,
        };
      })
    );

    
    const dailyStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(start_time) as date,
        SUM(hours) as total_hours,
        COUNT(*) as entries_count
      FROM time_entries 
      WHERE user_id = ${timesheet.userId}
        AND start_time >= ${timesheet.weekStart}
        AND start_time <= ${timesheet.weekEnd}
      GROUP BY DATE(start_time)
      ORDER BY date
    `;

    return {
      timesheet: {
        id: timesheet.id,
        weekStart: timesheet.weekStart,
        weekEnd: timesheet.weekEnd,
        status: timesheet.status,
        totalHours: timesheet.totalHours,
        submittedAt: timesheet.submittedAt,
        approvedAt: timesheet.approvedAt,
        rejectedAt: timesheet.rejectedAt,
        comments: timesheet.comments,
      },
      summary: {
        totalEntries: timesheet.timeEntries.length,
        totalHours: timesheet.totalHours,
        billableHours: timesheet.timeEntries
          .filter(entry => entry.billable)
          .reduce((sum, entry) => sum + parseFloat(entry.hours.toString()), 0),
        nonBillableHours: timesheet.timeEntries
          .filter(entry => !entry.billable)
          .reduce((sum, entry) => sum + parseFloat(entry.hours.toString()), 0),
        projectBreakdown: projectsData,
        dailyBreakdown: dailyStats,
      },
    };
  }

  async generateTimesheet(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const existingTimesheet = await this.prisma.timesheet.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (existingTimesheet) {
      throw new BadRequestException('Un timesheet existe déjà pour cette semaine');
    }

   
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    if (timeEntries.length === 0) {
      throw new BadRequestException('Aucune entrée de temps trouvée pour cette période');
    }

   
    const totalHours = timeEntries.reduce((total, entry) => {
      return total + parseFloat(entry.hours.toString());
    }, 0);

    return this.prisma.timesheet.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        totalHours: new Decimal(totalHours),
        status: TimesheetStatus.DRAFT,
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
        timeEntries: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async getTimesheetStats(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.AND = [];
      
      if (filters.startDate) {
        where.AND.push({
          weekStart: {
            gte: new Date(filters.startDate),
          },
        });
      }

      if (filters.endDate) {
        where.AND.push({
          weekEnd: {
            lte: new Date(filters.endDate),
          },
        });
      }
    }

    const [stats, statusStats] = await Promise.all([
      this.prisma.timesheet.aggregate({
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalHours: true,
        },
      }),
      this.prisma.timesheet.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalTimesheets: stats._count.id,
      totalHours: stats._sum.totalHours || 0,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<TimesheetStatus, number>),
    };
  }

  private async calculateTotalHours(userId: string, weekStart: string, weekEnd: string): Promise<number> {
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
      },
    });

    return timeEntries.reduce((total, entry) => {
      return total + parseFloat(entry.hours.toString());
    }, 0);
  }

  async updateTotalHours(timesheetId: string) {
    const timesheet = await this.findOne(timesheetId);
    
    const totalHours = await this.calculateTotalHours(
      timesheet.userId,
      timesheet.weekStart.toISOString(),
      timesheet.weekEnd.toISOString()
    );

    return this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        totalHours: new Decimal(totalHours),
      },
    });
  }
}