import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WeeklyReportRequestDto } from './dto/weekly-report-request.dto';
import { WeeklyReport, WeeklyReportService } from './weekly-report-service.';



@Controller('weekly-report')

export class WeeklyReportController {
  constructor(private readonly weeklyReportService: WeeklyReportService) {}

  @Get()
  async getWeeklyReport(@Query() query: WeeklyReportRequestDto): Promise<WeeklyReport> {
    return this.weeklyReportService.generateWeeklyReport(query);
  }

  @Get('current')
  async getCurrentWeekReport(@Query('userId') userId?: string): Promise<WeeklyReport> {
    return this.weeklyReportService.getCurrentWeekReport(userId);
  }

  @Get('user/:userId')
  async getUserWeeklyReport(
    @Param('userId') userId: string,
    @Query() query: Omit<WeeklyReportRequestDto, 'userId'>
  ): Promise<WeeklyReport> {
    const requestDto: WeeklyReportRequestDto = {
      ...query,
      userId,
    };

    return this.weeklyReportService.generateWeeklyReport(requestDto);
  }

  @Get('project/:projectId')
  async getProjectWeeklyReport(
    @Param('projectId') projectId: string,
    @Query() query: Omit<WeeklyReportRequestDto, 'projectId'>
  ): Promise<WeeklyReport> {
    const requestDto: WeeklyReportRequestDto = {
      ...query,
      projectId,
    };

    return this.weeklyReportService.generateWeeklyReport(requestDto);
  }

  @Get('trend')
  async getWeeklyTrend(
    @Query('weeks') weeks?: string,
    @Query('userId') userId?: string
  ): Promise<Array<{
    week: string;
    totalHours: number;
    overtimeHours: number;
    totalCost: number;
  }>> {
    const weeksCount = weeks ? parseInt(weeks) : 4;
    
    if (weeksCount > 12) {
      throw new BadRequestException('Maximum 12 weeks allowed for trend analysis');
    }

    return this.weeklyReportService.getWeeklyTrend(weeksCount, userId);
  }

  @Get('summary')
  async getWeeklySummary(
    @Query('weekStartDate') weekStartDate?: string,
    @Query('userId') userId?: string
  ): Promise<{
    totalHours: number;
    totalOvertimeHours: number;
    totalCost: number;
    totalUsers: number;
    avgHoursPerUser: number;
    mostActiveDay: string;
    leastActiveDay: string;
  }> {
    const report = await this.weeklyReportService.generateWeeklyReport({
      weekStartDate,
      userId,
      includeWeekends: false,
      includeDetails: true,
    });

    
    const sortedDays = [...report.dailyTotals].sort((a, b) => b.totalHours - a.totalHours);
    const mostActiveDay = sortedDays[0]?.dayOfWeek || 'N/A';
    const leastActiveDay = sortedDays[sortedDays.length - 1]?.dayOfWeek || 'N/A';

    return {
      totalHours: report.totalHours,
      totalOvertimeHours: report.totalOvertimeHours,
      totalCost: report.totalCost,
      totalUsers: report.totalUsers,
      avgHoursPerUser: report.avgHoursPerUser,
      mostActiveDay,
      leastActiveDay,
    };
  }

  @Get('dashboard')
  async getWeeklyDashboard(@Query('userId') userId?: string): Promise<{
    currentWeek: WeeklyReport;
    previousWeek: {
      totalHours: number;
      totalCost: number;
      overtimeHours: number;
    };
    trends: Array<{
      week: string;
      totalHours: number;
      overtimeHours: number;
      totalCost: number;
    }>;
    topPerformers: Array<{
      userName: string;
      totalHours: number;
      efficiency: number; 
    }>;
  }> {
   
    const currentWeek = await this.weeklyReportService.getCurrentWeekReport(userId);

   
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const previousWeekReport = await this.weeklyReportService.generateWeeklyReport({
      weekStartDate: lastWeekStart.toISOString(),
      userId,
      includeWeekends: false,
      includeDetails: false,
    });

   
    const trends = await this.weeklyReportService.getWeeklyTrend(4, userId);

   
    const topPerformers = currentWeek.users
      .map(user => ({
        userName: user.userName,
        totalHours: user.totalHours,
        efficiency: user.totalCost > 0 ? user.totalHours / user.totalCost * 100 : 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);

    return {
      currentWeek,
      previousWeek: {
        totalHours: previousWeekReport.totalHours,
        totalCost: previousWeekReport.totalCost,
        overtimeHours: previousWeekReport.totalOvertimeHours,
      },
      trends,
      topPerformers,
    };
  }
}