import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OvertimeReportService, OvertimeReportSummary } from './overtime-report.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ReportRequestDto } from './dto/report-request.dto';
 

@Controller('overtime-report')
 @UseGuards(JwtAuthGuard) 
export class OvertimeReportController {
  constructor(private readonly overtimeReportService: OvertimeReportService) {}

  @Get()
  async getOvertimeReport(@Query() query: ReportRequestDto): Promise<OvertimeReportSummary> {
    // Validation des dates
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }

    return this.overtimeReportService.generateOvertimeReport(query);
  }

  @Get('user/:userId')
  async getUserOvertimeReport(
    @Param('userId') userId: string,
    @Query() query: Omit<ReportRequestDto, 'userId'>
  ): Promise<OvertimeReportSummary> {
    const requestDto: ReportRequestDto = {
      ...query,
      userId,
    };

    return this.overtimeReportService.generateOvertimeReport(requestDto);
  }

  @Get('project/:projectId')
  async getProjectOvertimeReport(
    @Param('projectId') projectId: string,
    @Query() query: Omit<ReportRequestDto, 'projectId'>
  ): Promise<OvertimeReportSummary> {
    const requestDto: ReportRequestDto = {
      ...query,
      projectId,
    };

    return this.overtimeReportService.generateOvertimeReport(requestDto);
  }

  @Post('recalculate/:entryId')
  @HttpCode(HttpStatus.OK)
  async recalculateOvertimeForEntry(@Param('entryId') entryId: string): Promise<{ message: string }> {
    await this.overtimeReportService.calculateOvertimeForEntry(entryId);
    return { message: 'Overtime recalculated successfully' };
  }

  @Post('recalculate-all')
  @HttpCode(HttpStatus.OK)
  async recalculateAllOvertime(@Query('userId') userId?: string): Promise<{ message: string }> {
    await this.overtimeReportService.recalculateAllOvertime(userId);
    return { 
      message: userId 
        ? `Overtime recalculated for user ${userId}` 
        : 'Overtime recalculated for all users'
    };
  }

  @Get('summary')
  async getOvertimeSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string
  ): Promise<{
    totalOvertimeHours: number;
    totalOvertimeCost: number;
    avgOvertimePerUser: number;
    usersWithOvertime: number;
  }> {
    const request: ReportRequestDto = {
      startDate,
      endDate,
      userId,
      includeOvertimeOnly: true,
    };

    const report = await this.overtimeReportService.generateOvertimeReport(request);

    return {
      totalOvertimeHours: report.totalOvertimeHours,
      totalOvertimeCost: report.totalOvertimeCost,
      avgOvertimePerUser: report.totalUsers > 0 ? report.totalOvertimeHours / report.totalUsers : 0,
      usersWithOvertime: report.users.filter(user => user.overtimeHours > 0).length,
    };
  }
}