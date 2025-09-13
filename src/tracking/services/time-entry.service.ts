import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { Prisma, TimeEntry } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from '../dto/update-time-entry.dto';
import { TimeEntryFilterDto } from '../dto/time-entry-filter.dto';
import { TimeCalculationService } from './time-calculation.service';
import { ValidationService } from './validation-service';
import { TimeEntryStatus } from '../enum/time-entry-status.enum';

@Injectable()
export class TimeEntryService {
  constructor(
    private prisma: PrismaService,
    private timeCalculationService: TimeCalculationService,
    private validationService: ValidationService,
  ) {}

  async create(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    try {
      // 1. Validation des relations
      await this.validationService.validateRelations(createTimeEntryDto);

      // 2. Validation des contraintes de temps
      this.validationService.validateTimeConstraints(
        createTimeEntryDto.startTime,
        createTimeEntryDto.endTime,
      );

      // 3. Préparation des données avec calcul des heures
      const preparedData =
        this.timeCalculationService.prepareTimeEntryData(createTimeEntryDto);

      // 4. Vérification des chevauchements
      await this.validationService.checkTimeOverlap(
        createTimeEntryDto.userId,
        preparedData.startTime,
        preparedData.endTime,
      );

      // 5. Création de l'entrée de temps
      const timeEntry = await this.prisma.timeEntry.create({
        data: {
          userId: preparedData.userId,
          projectId: preparedData.projectId,
          taskId: preparedData.taskId,
          description: preparedData.description,
          startTime: preparedData.startTime,
          endTime: preparedData.endTime,
          hours: preparedData.hours,
          billable: false, // default
          status: 'PENDING', // default
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
      });

      return timeEntry;
    } catch (error) {
      // Log l'erreur pour le débogage
      console.error("Erreur lors de la création de l'entrée de temps:", error);

      // Re-lancer l'erreur si c'est déjà une erreur HTTP
      if (
        error instanceof BadRequestException ||
        error.constructor.name.includes('Exception')
      ) {
        throw error;
      }

      // Sinon, créer une nouvelle erreur générique
      throw new BadRequestException(
        `Erreur lors de la création de l'entrée de temps: ${error.message}`,
      );
    }
  }

  async findAll(filterDto: TimeEntryFilterDto) {
    const where: Prisma.TimeEntryWhereInput = {};

    if (filterDto.userId) where.userId = filterDto.userId;
    if (filterDto.projectId) where.projectId = filterDto.projectId;
    if (filterDto.taskId) where.taskId = filterDto.taskId;
    if (filterDto.timesheetId) where.timesheetId = filterDto.timesheetId;
    if (filterDto.status) where.status = filterDto.status;
    if (filterDto.billable !== undefined) where.billable = filterDto.billable;

    if (filterDto.startDate || filterDto.endDate) {
      where.startTime = {};
      if (filterDto.startDate)
        where.startTime.gte = new Date(filterDto.startDate);
      if (filterDto.endDate) where.startTime.lte = new Date(filterDto.endDate);
    }

    if (filterDto.search) {
      where.description = {
        contains: filterDto.search,
        mode: 'insensitive',
      };
    }

    const timeEntries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
        timesheet: {
          select: { id: true, weekStart: true, weekEnd: true, status: true },
        },
      },
      orderBy: {
        startTime: filterDto.sortOrder === 'asc' ? 'asc' : 'desc',
      },
      take: filterDto.limit,
      skip: filterDto.offset,
    });

    return timeEntries;
  }

  async findByUser(userId: string, filterDto: TimeEntryFilterDto) {
    return this.findAll({ ...filterDto, userId });
  }

  async findByProject(projectId: string, filterDto: TimeEntryFilterDto) {
    return this.findAll({ ...filterDto, projectId });
  }

  async findOne(id: string) {
    const timeEntry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
        timesheet: {
          select: { id: true, weekStart: true, weekEnd: true, status: true },
        },
      },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto) {
    const existingEntry = await this.findOne(id);
    if (existingEntry.status === TimeEntryStatus.APPROVED) {
      throw new BadRequestException('Cannot modify approved time entry');
    }
    let hours: Decimal | undefined = updateTimeEntryDto.hours
      ? new Decimal(updateTimeEntryDto.hours)
      : undefined;
    if (updateTimeEntryDto.startTime && updateTimeEntryDto.endTime) {
      const start = new Date(updateTimeEntryDto.startTime);
      const end = new Date(updateTimeEntryDto.endTime);
      hours = new Decimal((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }

    try {
      const timeEntry = await this.prisma.timeEntry.update({
        where: { id },
        data: {
          description: updateTimeEntryDto.description,
          projectId: updateTimeEntryDto.projectId,
          taskId: updateTimeEntryDto.taskId,
          status: updateTimeEntryDto.status,
          hours: hours,
          startTime: updateTimeEntryDto.startTime
            ? new Date(updateTimeEntryDto.startTime)
            : undefined,
          endTime: updateTimeEntryDto.endTime
            ? new Date(updateTimeEntryDto.endTime)
            : undefined,
          // Supprimer userId et date car ils ne peuvent pas être modifiés
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
          task: {
            select: { id: true, title: true },
          },
          timesheet: {
            select: { id: true, weekStart: true, weekEnd: true, status: true },
          },
        },
      });

      if (timeEntry.timesheetId) {
        await this.updateTimesheetTotalHours(timeEntry.timesheetId);
      }

      return timeEntry;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Time entry not found');
      }
      throw new BadRequestException('Failed to update time entry');
    }
  }

  async remove(id: string) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.status === TimeEntryStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved time entry');
    }

    try {
      await this.prisma.timeEntry.delete({
        where: { id },
      });

      if (timeEntry.timesheetId) {
        await this.updateTimesheetTotalHours(timeEntry.timesheetId);
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Time entry not found');
      }
      throw new BadRequestException('Failed to delete time entry');
    }
  }

  async getRunningEntry(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async startTimer(id: string) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.endTime) {
      throw new BadRequestException('Time entry is already completed');
    }

    const runningEntry = await this.getRunningEntry(timeEntry.userId);
    if (runningEntry && runningEntry.id !== id) {
      throw new ConflictException('User already has a running timer');
    }

    return timeEntry;
  }

  async stopTimer(id: string) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.endTime) {
      throw new BadRequestException('Timer is not running');
    }

    const endTime = new Date();
    const hours = new Decimal(
      (endTime.getTime() - timeEntry.startTime.getTime()) / (1000 * 60 * 60),
    );

    const updatedEntry = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        hours,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return updatedEntry;
  }

  async startNewTimer(createTimeEntryDto: CreateTimeEntryDto) {
    const runningEntry = await this.getRunningEntry(createTimeEntryDto.userId);
    if (runningEntry) {
      await this.stopTimer(runningEntry.id);
    }

    return this.create({
      ...createTimeEntryDto,
      startTime: new Date().toISOString(),
      endTime: null,
    });
  }

  async getUserStats(userId: string, startDate?: string, endDate?: string) {
    const where: Prisma.TimeEntryWhereInput = {
      userId,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [totalEntries, totalHours, billableHours, entriesByProject] =
      await Promise.all([
        this.prisma.timeEntry.count({ where }),

        this.prisma.timeEntry.aggregate({
          where,
          _sum: { hours: true },
        }),

        this.prisma.timeEntry.aggregate({
          where: { ...where, billable: true },
          _sum: { hours: true },
        }),

        this.prisma.timeEntry.groupBy({
          by: ['projectId'],
          where,
          _sum: { hours: true },
          _count: { id: true },
          orderBy: { _sum: { hours: 'desc' } },
        }),
      ]);

    const projectIds = entriesByProject.map((entry) => entry.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
    });

    const projectsWithStats = entriesByProject.map((entry) => ({
      project: projects.find((p) => p.id === entry.projectId),
      totalHours: entry._sum.hours || 0,
      totalEntries: entry._count.id,
    }));

    return {
      totalEntries,
      totalHours: totalHours._sum.hours || 0,
      billableHours: billableHours._sum.hours || 0,
      nonBillableHours:
        Number(totalHours._sum.hours || 0) -
        Number(billableHours._sum.hours || 0),
      projectsBreakdown: projectsWithStats,
    };
  }

  async approve(id: string, approvedBy: string) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.status !== TimeEntryStatus.PENDING) {
      throw new BadRequestException('Time entry is not pending approval');
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        status: TimeEntryStatus.APPROVED,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async reject(id: string, rejectedBy: string, reason?: string) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.status !== TimeEntryStatus.PENDING) {
      throw new BadRequestException('Time entry is not pending approval');
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        status: TimeEntryStatus.REJECTED,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  private async validateRelations(dto: CreateTimeEntryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }
  }

  private async updateTimesheetTotalHours(timesheetId: string) {
    const totalHours = await this.prisma.timeEntry.aggregate({
      where: { timesheetId },
      _sum: { hours: true },
    });

    await this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: { totalHours: totalHours._sum.hours || 0 },
    });
  }
}
