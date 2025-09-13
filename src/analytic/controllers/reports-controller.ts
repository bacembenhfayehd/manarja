import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { ReportBuilderService } from '../services/report-builder.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import { ReportFilterDto } from '../dto/report-filter.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';
import { cursorTo } from 'readline';

@Controller('analytics/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportBuilder: ReportBuilderService) {}

  // Generate project overview report
  @Post('project-overview/generate')
  async generateProjectReport(
    @Body() filters: ReportFilterDto,
    @CurrentUser('id') userId: string
  ) {
    const reportData = await this.reportBuilder.generateProjectReport({
      ...filters,
      userId: filters.userId || userId
    });

    return {
      success: true,
      data: reportData,
      generatedAt: new Date(),
      type: 'PROJECT_OVERVIEW'
    };
  }

  // Generate time tracking report
  @Post('time-tracking/generate')
  async generateTimeReport(
    @Body() filters: ReportFilterDto,
    @CurrentUser('id') userId: string
  ) {
    const reportData = await this.reportBuilder.generateTimeReport({
      ...filters,
      userId: filters.userId || userId
    });

    return {
      success: true,
      data: reportData,
      generatedAt: new Date(),
      type: 'TIME_TRACKING'
    };
  }

  // Generate expense report
  @Post('expense-summary/generate')
  async generateExpenseReport(
    @Body() filters: ReportFilterDto,
    @CurrentUser('id') userId: string
  ) {
    const reportData = await this.reportBuilder.generateExpenseReport({
      ...filters,
      userId: filters.userId || userId
    });

    return {
      success: true,
      data: reportData,
      generatedAt: new Date(),
      type: 'EXPENSE_SUMMARY'
    };
  }

  // Save custom report configuration
  @Post()
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser('id') userId: string
  ) {
    const report = await this.reportBuilder.saveReportConfig(userId, createReportDto);
    
    return {
      success: true,
      data: report,
      message: 'Report configuration saved successfully'
    };
  }

  // Get all user reports
  @Get()
  async getUserReports(@CurrentUser('id') userId: string) {
    const reports = await this.reportBuilder.getUserReports(userId);
    
    return {
      success: true,
      data: reports,
      count: reports.length
    };
  }

  // Get specific report
  @Get(':id')
  async getReport(
    @Param('id', ParseIntPipe) reportId: string,
    @CurrentUser('id') userId: string
  ) {
    const reports = await this.reportBuilder.getUserReports(userId);
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
      return {
        success: false,
        message: 'Report not found'
      };
    }

    return {
      success: true,
      data: report
    };
  }

  // Execute saved report
  @Post(':id/execute')
  async executeReport(
    @Param('id', ParseIntPipe) reportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      // Verify report belongs to user
      const userReports = await this.reportBuilder.getUserReports(userId);
      const report = userReports.find(r => r.id === reportId);
      
      if (!report) {
        return {
          success: false,
          message: 'Report not found or access denied'
        };
      }

      const reportData = await this.reportBuilder.executeReport(reportId);
      
      return {
        success: true,
        data: reportData,
        reportName: report.title,
        reportType: report.type,
        executedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update report configuration
  @Put(':id')
  async updateReport(
    @Param('id', ParseIntPipe) reportId: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser('id') userId: string
  ) {
    // Here you'd implement update logic in ReportBuilderService
    return {
      success: true,
      message: 'Report updated successfully'
    };
  }

  // Delete report
  @Delete(':id')
  async deleteReport(
    @Param('id', ParseIntPipe) reportId: number,
    @CurrentUser('id') userId: number
  ) {
    // Here you'd implement delete logic in ReportBuilderService
    return {
      success: true,
      message: 'Report deleted successfully'
    };
  }
}