import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailSchedulerService } from '../services/email-scheduler.service';

@Injectable()
export class ScheduledReportsJob {
  private readonly logger = new Logger(ScheduledReportsJob.name);

  constructor(private emailScheduler: EmailSchedulerService) {}

  // Run daily at 8:00 AM to check for scheduled reports
  @Cron('0 8 * * *', {
    name: 'daily-scheduled-reports',
    timeZone: 'UTC',
  })
  async handleDailyReports() {
    this.logger.log('Starting daily scheduled reports job...');
    
    try {
      const scheduledReports = await this.emailScheduler.getScheduledReports();
      
      for (const report of scheduledReports) {
        if (this.emailScheduler.shouldSendToday(report)) {
          this.logger.log(`Sending scheduled report: ${report.report.title} (ID: ${report.id})`);
          
          try {
            await this.emailScheduler.executeScheduledReport(report.id);
            this.logger.log(`Successfully sent report: ${report.report.title}`);
          } catch (error) {
            this.logger.error(`Failed to send report ${report.report.title}:`, error.message);
          }
        }
      }
      
      this.logger.log('Daily scheduled reports job completed');
    } catch (error) {
      this.logger.error('Daily scheduled reports job failed:', error.message);
    }
  }

  // Run weekly reports on Mondays at 9:00 AM
  @Cron('0 9 * * 1', {
    name: 'weekly-scheduled-reports',
    timeZone: 'UTC',
  })
  async handleWeeklyReports() {
    this.logger.log('Starting weekly scheduled reports job...');
    
    try {
      const scheduledReports = await this.emailScheduler.getScheduledReports();
      const weeklyReports = scheduledReports.filter(r => r.frequency === 'WEEKLY');
      
      for (const report of weeklyReports) {
        if (this.emailScheduler.shouldSendToday(report)) {
          await this.emailScheduler.executeScheduledReport(report.id);
          this.logger.log(`Weekly report sent: ${report.report.title}`);
        }
      }
      
      this.logger.log('Weekly scheduled reports job completed');
    } catch (error) {
      this.logger.error('Weekly scheduled reports job failed:', error.message);
    }
  }

  // Run monthly reports on the 1st day of each month at 10:00 AM
  @Cron('0 10 1 * *', {
    name: 'monthly-scheduled-reports',
    timeZone: 'UTC',
  })
  async handleMonthlyReports() {
    this.logger.log('Starting monthly scheduled reports job...');
    
    try {
      const scheduledReports = await this.emailScheduler.getScheduledReports();
      const monthlyReports = scheduledReports.filter(r => r.frequency === 'MONTHLY');
      
      for (const report of monthlyReports) {
        await this.emailScheduler.executeScheduledReport(report.id);
        this.logger.log(`Monthly report sent: ${report.report.title}`);
      }
      
      this.logger.log('Monthly scheduled reports job completed');
    } catch (error) {
      this.logger.error('Monthly scheduled reports job failed:', error.message);
    }
  }
}
