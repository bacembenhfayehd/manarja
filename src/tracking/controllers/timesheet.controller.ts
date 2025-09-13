import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetService } from '../services/timesheet.service';
import { CreateTimesheetDto } from '../dto/create-timesheet.dto';
import { TimesheetFilterDto } from '../dto/timesheet-filter.dto';
import { ApproveTimesheetDto } from '../dto/approve-timesheet';


@ApiTags('timesheets')
@ApiBearerAuth()
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new timesheet' })
  @ApiResponse({ status: 201, description: 'Timesheet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  async create(@Body() createTimesheetDto: CreateTimesheetDto) {
    return this.timesheetService.create(createTimesheetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all timesheets with filtering' })
  @ApiResponse({ status: 200, description: 'Timesheets retrieved successfully' })
  async findAll(@Query() filterDto: TimesheetFilterDto) {
    return this.timesheetService.findAll(filterDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get timesheets for a specific user' })
  @ApiResponse({ status: 200, description: 'User timesheets retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() filterDto: TimesheetFilterDto,
  ) {
    return this.timesheetService.findByUser(userId, filterDto);
  }

  @Get('user/:userId/current')
  @ApiOperation({ summary: 'Get current week timesheet for user' })
  @ApiResponse({ status: 200, description: 'Current timesheet retrieved successfully' })
  async getCurrentWeekTimesheet(@Param('userId') userId: string) {
    return this.timesheetService.getCurrentWeekTimesheet(userId);
  }

  @Get('pending-approval')
  @ApiOperation({ summary: 'Get timesheets pending approval' })
  @ApiResponse({ status: 200, description: 'Pending timesheets retrieved successfully' })
  async getPendingApproval(@Query() filterDto: TimesheetFilterDto) {
    return this.timesheetService.getPendingApproval(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get timesheet by ID' })
  @ApiResponse({ status: 200, description: 'Timesheet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async findOne(@Param('id') id: string) {
    return this.timesheetService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet updated successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: { comments?: string },
  ) {
    return this.timesheetService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete timesheet' })
  @ApiResponse({ status: 204, description: 'Timesheet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async remove(@Param('id') id: string) {
    return this.timesheetService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit timesheet for approval' })
  @ApiResponse({ status: 200, description: 'Timesheet submitted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot submit timesheet in current state' })
  async submit(@Param('id') id: string) {
    return this.timesheetService.submit(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet approved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot approve timesheet in current state' })
  async approve(
    @Param('id') id: string,
    @Body() approveTimesheetDto: ApproveTimesheetDto,
  ) {
    return this.timesheetService.approve(id, approveTimesheetDto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet rejected successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reject timesheet in current state' })
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectedBy: string; comments?: string },
  ) {
    return this.timesheetService.reject(id, body.rejectedBy, body.comments);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen rejected timesheet to draft' })
  @ApiResponse({ status: 200, description: 'Timesheet reopened successfully' })
  async reopen(@Param('id') id: string) {
    return this.timesheetService.reopen(id);
  }

  @Post(':id/add-time-entries')
  @ApiOperation({ summary: 'Add time entries to timesheet' })
  @ApiResponse({ status: 200, description: 'Time entries added successfully' })
  async addTimeEntries(
    @Param('id') id: string,
    @Body() body: { timeEntryIds: string[] },
  ) {
    return this.timesheetService.addTimeEntries(id, body.timeEntryIds);
  }

  @Delete(':id/time-entries/:timeEntryId')
  @ApiOperation({ summary: 'Remove time entry from timesheet' })
  @ApiResponse({ status: 200, description: 'Time entry removed successfully' })
  async removeTimeEntry(
    @Param('id') id: string,
    @Param('timeEntryId') timeEntryId: string,
  ) {
    return this.timesheetService.removeTimeEntry(id, timeEntryId);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get timesheet summary with statistics' })
  @ApiResponse({ status: 200, description: 'Timesheet summary retrieved successfully' })
  async getTimesheetSummary(@Param('id') id: string) {
    return this.timesheetService.getTimesheetSummary(id);
  }

  @Post('generate/:userId')
  @ApiOperation({ summary: 'Auto-generate timesheet for user based on time entries' })
  @ApiResponse({ status: 201, description: 'Timesheet generated successfully' })
  async generateTimesheet(
    @Param('userId') userId: string,
    @Body() body: { weekStart: string },
  ) {
    return this.timesheetService.generateTimesheet(userId, new Date(body.weekStart));
  }
}