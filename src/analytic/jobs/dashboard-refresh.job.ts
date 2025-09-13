import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DashboardService } from '../services/dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardRefreshJob {
  private readonly logger = new Logger(DashboardRefreshJob.name);

  constructor(
    private dashboardService: DashboardService,
    private prisma: PrismaService
  ) {}

  // Refresh dashboard cache every hour
  @Cron('0 * * * *', {
    name: 'dashboard-cache-refresh',
    timeZone: 'UTC',
  })
  async refreshDashboardCache() {
    this.logger.log('Starting dashboard cache refresh job...');
    
    try {
      // Get all active users
      const activeUsers = await this.prisma.user.findMany({
        where: { 
          // Add your active user criteria here
          // e.g., lastLoginAt: { gte: thirtyDaysAgo }
        },
        select: { id: true }
      });

      // Pre-calculate KPIs for active users
      for (const user of activeUsers) {
        try {
          await this.dashboardService.getProjectKPIs(undefined, user.id);
          await this.dashboardService.getTimeAnalytics(undefined, user.id);
          await this.dashboardService.getExpenseAnalytics(undefined, user.id);
          
          this.logger.debug(`Dashboard cache refreshed for user ${user.id}`);
        } catch (error) {
          this.logger.error(`Failed to refresh cache for user ${user.id}:`, error.message);
        }
      }
      
      this.logger.log(`Dashboard cache refresh completed for ${activeUsers.length} users`);
    } catch (error) {
      this.logger.error('Dashboard cache refresh job failed:', error.message);
    }
  }

  // Cleanup old data every day at midnight
  @Cron('0 0 * * *', {
    name: 'dashboard-cleanup',
    timeZone: 'UTC',
  })
  async cleanupOldData() {
    this.logger.log('Starting dashboard cleanup job...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Example: Clean up old temporary report data
      // You can add cleanup logic here based on your needs
      
      this.logger.log('Dashboard cleanup job completed');
    } catch (error) {
      this.logger.error('Dashboard cleanup job failed:', error.message);
    }
  }
}
