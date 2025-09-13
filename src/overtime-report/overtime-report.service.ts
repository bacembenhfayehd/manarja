import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportRequestDto } from './dto/report-request.dto';


export interface OvertimeReportData {
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
  hourlyRate: number;
  entries: Array<{
    id: string;
    date: Date;
    hours: number;
    overtimeHours: number;
    cost: number;
    projectName?: string;
  }>;
}

export interface OvertimeReportSummary {
  period: string;
  totalUsers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalRegularCost: number;
  totalOvertimeCost: number;
  totalCost: number;
  users: OvertimeReportData[];
}

@Injectable()
export class OvertimeReportService {
  constructor(private prisma: PrismaService) {}

  async generateOvertimeReport(request: ReportRequestDto): Promise<OvertimeReportSummary> {
    const { startDate, endDate, userId, projectId, includeOvertimeOnly } = request;

   
    const whereClause: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (includeOvertimeOnly) {
      whereClause.overtimeHours = {
        gt: 0,
      };
    }

   
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { userId: 'asc' },
        { date: 'desc' },
      ],
    });

    if (timeEntries.length === 0) {
      return {
        period: `${startDate} - ${endDate}`,
        totalUsers: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalRegularCost: 0,
        totalOvertimeCost: 0,
        totalCost: 0,
        users: [],
      };
    }

    
    const userReports = this.groupEntriesByUser(timeEntries);

    
    const summary = this.calculateGlobalSummary(userReports, startDate, endDate);

    return summary;
  }

  async calculateOvertimeForEntry(entryId: string): Promise<void> {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { user: true },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    const { overtimeHours, cost } = this.calculateOvertimeAndCost(
      entry.hours,
      entry.user.hourlyRate
    );

    await this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        overtimeHours,
        cost,
      },
    });
  }

  async recalculateAllOvertime(userId?: string): Promise<void> {
    const whereClause = userId ? { userId } : {};

    const entries = await this.prisma.timeEntry.findMany({
      where: whereClause,
      include: { user: true },
    });

    for (const entry of entries) {
      const { overtimeHours, cost } = this.calculateOvertimeAndCost(
        entry.hours,
        entry.user.hourlyRate
      );

      await this.prisma.timeEntry.update({
        where: { id: entry.id },
        data: {
          overtimeHours,
          cost,
        },
      });
    }
  }

  private groupEntriesByUser(timeEntries: any[]): OvertimeReportData[] {
    const userMap = new Map<string, OvertimeReportData>();

    timeEntries.forEach((entry) => {
      const userId = entry.user.id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: entry.user.name || entry.user.email,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          regularCost: 0,
          overtimeCost: 0,
          totalCost: 0,
          hourlyRate: entry.user.hourlyRate,
          entries: [],
        });
      }

      const userReport = userMap.get(userId)!;
      const regularHours = Math.min(entry.hours, 8); 
      const overtimeHours = Math.max(0, entry.hours - 8);
      const regularCost = regularHours * entry.user.hourlyRate;
      const overtimeCost = overtimeHours * entry.user.hourlyRate * 1.5; 

     
      userReport.totalHours += entry.hours;
      userReport.regularHours += regularHours;
      userReport.overtimeHours += overtimeHours;
      userReport.regularCost += regularCost;
      userReport.overtimeCost += overtimeCost;
      userReport.totalCost += (regularCost + overtimeCost);

     
      userReport.entries.push({
        id: entry.id,
        date: entry.date,
        hours: entry.hours,
        overtimeHours,
        cost: regularCost + overtimeCost,
        projectName: entry.project?.name,
      });
    });

    return Array.from(userMap.values());
  }

  private calculateOvertimeAndCost(hours: number, hourlyRate: number): { overtimeHours: number; cost: number } {
    const regularHours = Math.min(hours, 8);
    const overtimeHours = Math.max(0, hours - 8);
    
    const regularCost = regularHours * hourlyRate;
    const overtimeCost = overtimeHours * hourlyRate * 1.5;
    const totalCost = regularCost + overtimeCost;

    return {
      overtimeHours,
      cost: totalCost,
    };
  }

  private calculateGlobalSummary(userReports: OvertimeReportData[], startDate: string, endDate: string): OvertimeReportSummary {
    return {
      period: `${startDate} - ${endDate}`,
      totalUsers: userReports.length,
      totalRegularHours: userReports.reduce((sum, user) => sum + user.regularHours, 0),
      totalOvertimeHours: userReports.reduce((sum, user) => sum + user.overtimeHours, 0),
      totalRegularCost: userReports.reduce((sum, user) => sum + user.regularCost, 0),
      totalOvertimeCost: userReports.reduce((sum, user) => sum + user.overtimeCost, 0),
      totalCost: userReports.reduce((sum, user) => sum + user.totalCost, 0),
      users: userReports,
    };
  }
}