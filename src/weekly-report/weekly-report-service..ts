import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyReportRequestDto } from './dto/weekly-report-request.dto';


export interface DailySummary {
  date: string;
  dayOfWeek: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalCost: number;
  entriesCount: number;
}

export interface UserWeeklySummary {
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalCost: number;
  hourlyRate: number;
  dailyBreakdown: DailySummary[];
  projects: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    cost: number;
  }>;
}

export interface WeeklyReport {
  weekPeriod: string;
  weekStartDate: string;
  weekEndDate: string;
  totalUsers: number;
  totalHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalCost: number;
  avgHoursPerUser: number;
  users: UserWeeklySummary[];
  dailyTotals: DailySummary[];
}

@Injectable()
export class WeeklyReportService {
  constructor(private prisma: PrismaService) {}

  async generateWeeklyReport(request: WeeklyReportRequestDto): Promise<WeeklyReport> {
    const { weekStartDate, userId, projectId, includeWeekends, includeDetails } = request;

    
    const { startDate, endDate } = this.getWeekDates(weekStartDate, includeWeekends);

   
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userId) whereClause.userId = userId;
    if (projectId) whereClause.projectId = projectId;

    
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName:true,
            email: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { startTime: 'asc' },
        { userId: 'asc' },
      ],
    });

   
    return this.buildWeeklyReport(timeEntries, startDate, endDate, includeDetails);
  }

  async getCurrentWeekReport(userId?: string): Promise<WeeklyReport> {
    return this.generateWeeklyReport({
      userId,
      includeWeekends: false,
      includeDetails: true,
    });
  }

  async getWeeklyTrend(weeksCount: number = 4, userId?: string): Promise<Array<{
    week: string;
    totalHours: number;
    overtimeHours: number;
    totalCost: number;
  }>> {
    const trends = [];
    const today = new Date();

    for (let i = 0; i < weeksCount; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (7 * i) - today.getDay() + 1); 
      weekStart.setHours(0, 0, 0, 0);

      const report = await this.generateWeeklyReport({
        weekStartDate: weekStart.toISOString(),
        userId,
        includeWeekends: false,
        includeDetails: false,
      });

      trends.unshift({
        week: report.weekPeriod,
        totalHours: report.totalHours,
        overtimeHours: report.totalOvertimeHours,
        totalCost: report.totalCost,
      });
    }

    return trends;
  }

  private getWeekDates(weekStartDate?: string, includeWeekends: boolean = false): { startDate: Date; endDate: Date } {
    let startDate: Date;

    if (weekStartDate) {
      startDate = new Date(weekStartDate);
    } else {
      
      startDate = new Date();
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + daysToMonday);
    }

    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (includeWeekends ? 6 : 4)); 
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private buildWeeklyReport(
    timeEntries: any[],
    startDate: Date,
    endDate: Date,
    includeDetails: boolean
  ): WeeklyReport {
    const weekPeriod = `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    
  
    const userMap = new Map<string, UserWeeklySummary>();
    const dailyTotalsMap = new Map<string, DailySummary>();

   
    this.initializeDailyTotals(startDate, endDate, dailyTotalsMap);

    timeEntries.forEach((entry) => {
      const userId = entry.user.id;
      const entryDate = new Date(entry.date);
      const dateKey = this.formatDate(entryDate);
      const dayOfWeek = this.getDayOfWeek(entryDate);

      
      const regularHours = Math.min(entry.hours, 8);
      const overtimeHours = Math.max(0, entry.hours - 8);
      const regularCost = regularHours * entry.user.hourlyRate;
      const overtimeCost = overtimeHours * entry.user.hourlyRate * 1.5;
      const totalCost = regularCost + overtimeCost;

     
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: entry.user.name || entry.user.email,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalCost: 0,
          hourlyRate: entry.user.hourlyRate,
          dailyBreakdown: this.initializeUserDailyBreakdown(startDate, endDate),
          projects: [],
        });
      }

      const userSummary = userMap.get(userId)!;

      
      userSummary.totalHours += entry.hours;
      userSummary.regularHours += regularHours;
      userSummary.overtimeHours += overtimeHours;
      userSummary.totalCost += totalCost;

      
      if (includeDetails) {
        const userDailySummary = userSummary.dailyBreakdown.find(d => d.date === dateKey);
        if (userDailySummary) {
          userDailySummary.totalHours += entry.hours;
          userDailySummary.regularHours += regularHours;
          userDailySummary.overtimeHours += overtimeHours;
          userDailySummary.totalCost += totalCost;
          userDailySummary.entriesCount += 1;
        }

        
        const existingProject = userSummary.projects.find(p => p.projectId === entry.project?.id);
        if (existingProject) {
          existingProject.hours += entry.hours;
          existingProject.cost += totalCost;
        } else if (entry.project) {
          userSummary.projects.push({
            projectId: entry.project.id,
            projectName: entry.project.name,
            hours: entry.hours,
            cost: totalCost,
          });
        }
      }

      
      const dailyTotal = dailyTotalsMap.get(dateKey)!;
      dailyTotal.totalHours += entry.hours;
      dailyTotal.regularHours += regularHours;
      dailyTotal.overtimeHours += overtimeHours;
      dailyTotal.totalCost += totalCost;
      dailyTotal.entriesCount += 1;
    });

    const users = Array.from(userMap.values());
    const dailyTotals = Array.from(dailyTotalsMap.values());

    
    const totalHours = users.reduce((sum, user) => sum + user.totalHours, 0);
    const totalRegularHours = users.reduce((sum, user) => sum + user.regularHours, 0);
    const totalOvertimeHours = users.reduce((sum, user) => sum + user.overtimeHours, 0);
    const totalCost = users.reduce((sum, user) => sum + user.totalCost, 0);

    return {
      weekPeriod,
      weekStartDate: startDate.toISOString(),
      weekEndDate: endDate.toISOString(),
      totalUsers: users.length,
      totalHours,
      totalRegularHours,
      totalOvertimeHours,
      totalCost,
      avgHoursPerUser: users.length > 0 ? totalHours / users.length : 0,
      users,
      dailyTotals,
    };
  }

  private initializeDailyTotals(startDate: Date, endDate: Date, dailyTotalsMap: Map<string, DailySummary>): void {
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.formatDate(currentDate);
      const dayOfWeek = this.getDayOfWeek(currentDate);

      dailyTotalsMap.set(dateKey, {
        date: dateKey,
        dayOfWeek,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        totalCost: 0,
        entriesCount: 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private initializeUserDailyBreakdown(startDate: Date, endDate: Date): DailySummary[] {
    const breakdown: DailySummary[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = this.formatDate(currentDate);
      const dayOfWeek = this.getDayOfWeek(currentDate);

      breakdown.push({
        date: dateKey,
        dayOfWeek,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        totalCost: 0,
        entriesCount: 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return breakdown;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Thursday', 'Wednesday', 'Thursday', 'Friday', 'Saaturday'];
    return days[date.getDay()];
  }
}