import { 
  Controller, 
  Get, 
  Query, 
  ParseIntPipe,
  UseGuards,
  Optional, 
  Param
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';


@Controller('analytics/dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private dashboardService: DashboardService) {}

  // Get main KPI overview
  @Get('kpis')
  async getKPIs(
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string
  ) {
    const kpis = await this.dashboardService.getProjectKPIs(
      projectId,
      userId
    );

    return {
      success: true,
      data: kpis,
      updatedAt: new Date()
    };
  }

  // Get time analytics for charts
  @Get('time-analytics')
  async getTimeAnalytics(
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string
  ) {
    const analytics = await this.dashboardService.getTimeAnalytics(
      projectId ,
      userId
    );

    return {
      success: true,
      data: analytics,
      updatedAt: new Date()
    };
  }

  // Get expense analytics
  @Get('expense-analytics')
  async getExpenseAnalytics(
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string
  ) {
    const analytics = await this.dashboardService.getExpenseAnalytics(
      projectId ,
      userId
    );

    return {
      success: true,
      data: analytics,
      updatedAt: new Date()
    };
  }

  // Get task status distribution
  @Get('task-status')
  async getTaskStatusDistribution(
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string
  ) {
    const distribution = await this.dashboardService.getTaskStatusDistribution(
      projectId ,
      userId
    );

    return {
      success: true,
      data: distribution,
      updatedAt: new Date()
    };
  }

  // Get complete dashboard data in one call
  @Get('overview')
  async getDashboardOverview(
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string
  ) {
    const projectIdNum = projectId 

    const [kpis, timeAnalytics, expenseAnalytics, taskStatus] = await Promise.all([
      this.dashboardService.getProjectKPIs(projectIdNum, userId),
      this.dashboardService.getTimeAnalytics(projectIdNum, userId),
      this.dashboardService.getExpenseAnalytics(projectIdNum, userId),
      this.dashboardService.getTaskStatusDistribution(projectIdNum, userId)
    ]);

    return {
      success: true,
      data: {
        kpis,
        timeAnalytics,
        expenseAnalytics,
        taskStatus
      },
      updatedAt: new Date()
    };
  }

  // Get project-specific dashboard
  @Get('projects/:projectId')
  async getProjectDashboard(
    @Param('projectId', ParseIntPipe) projectId: string,
    @CurrentUser('id') userId: string
  ) {
    const [kpis, timeAnalytics, expenseAnalytics, taskStatus] = await Promise.all([
      this.dashboardService.getProjectKPIs(projectId, userId),
      this.dashboardService.getTimeAnalytics(projectId, userId),
      this.dashboardService.getExpenseAnalytics(projectId, userId),
      this.dashboardService.getTaskStatusDistribution(projectId, userId)
    ]);

    return {
      success: true,
      data: {
        projectId,
        kpis,
        timeAnalytics,
        expenseAnalytics,
        taskStatus
      },
      updatedAt: new Date()
    };
  }
}
