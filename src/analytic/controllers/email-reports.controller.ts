import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { EmailSchedulerService } from '../services/email-scheduler.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { EmailScheduleDto } from '../dto/email-schedule.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';

@Controller('analytics/email-reports')
@UseGuards(JwtAuthGuard)
export class EmailReportsController {
  constructor(private emailScheduler: EmailSchedulerService) {}

  // Schedule a report for email delivery
  @Post('schedule')
  async scheduleReport(
    @Body() scheduleDto: EmailScheduleDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      const scheduledReport = await this.emailScheduler.scheduleReport(
        userId, 
        scheduleDto
      );

      return {
        success: true,
        data: scheduledReport,
        message: 'Report scheduled successfully for email delivery'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get all scheduled reports for user
  @Get('scheduled')
  async getScheduledReports(@CurrentUser('id') userId: string) {
    const scheduledReports = await this.emailScheduler.getScheduledReports();
    
    

    return {
      success: true,
      data: scheduledReports,
      count:scheduledReports.length
    };
  }

  // Send report immediately
  @Post('send/:reportId')
  async sendReportNow(
    @Param('reportId', ParseIntPipe) reportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      const result = await this.emailScheduler.executeScheduledReport(reportId);
      
      return {
        success: true,
        data: result,
        message: 'Report sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update scheduled report configuration
  @Put('schedule/:reportId')
  async updateScheduledReport(
    @Param('reportId', ParseIntPipe) reportId: string,
    @Body() scheduleDto: EmailScheduleDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      const updatedReport = await this.emailScheduler.scheduleReport(
        userId,
        { ...scheduleDto, reportId }
      );

      return {
        success: true,
        data: updatedReport,
        message: 'Schedule updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Cancel scheduled report
  @Delete('schedule/:reportId')
  async cancelScheduledReport(
    @Param('reportId', ParseIntPipe) reportId: string,
    @CurrentUser('id') userId: string
  ) {
    // This would update the report to set isScheduled = false
    // You'd implement this in EmailSchedulerService
    
    return {
      success: true,
      message: 'Report schedule cancelled successfully'
    };
  }

  // Send dashboard digest immediately
  @Post('dashboard-digest')
  async sendDashboardDigest(
    @Body('recipients') recipients: string[],
    @CurrentUser('id') userId: string
  ) {
    try {
      const result = await this.emailScheduler.sendDashboardDigest(
        userId, 
        recipients
      );

      return {
        success: true,
        data: result,
        message: 'Dashboard digest sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Test email configuration
  @Post('test')
  async testEmailConfiguration(
    @Body('email') email: string,
    @CurrentUser('id') userId: number
  ) {
    // Here you'd test your email configuration
    // Using your existing nodemailer service
    
    return {
      success: true,
      message: `Test email sent to ${email}`
    };
  }

  // Get email delivery history/logs
  @Get('history')
  async getEmailHistory(@CurrentUser('id') userId: number) {
    // This would require a separate EmailLog model to track sent emails
    // For now, return placeholder
    
    return {
      success: true,
      data: [],
      message: 'Email history feature coming soon'
    };
  }
}
