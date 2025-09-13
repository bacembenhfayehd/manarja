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
import { TimeEntryService } from '../services/time-entry.service';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from '../dto/update-time-entry.dto';
import { TimeEntryFilterDto } from '../dto/time-entry-filter.dto';


@ApiTags('time-entries')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  async create(@Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.timeEntryService.create(createTimeEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries with filtering' })
  @ApiResponse({ status: 200, description: 'Time entries retrieved successfully' })
  async findAll(@Query() filterDto: TimeEntryFilterDto) {
    return this.timeEntryService.findAll(filterDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get time entries for a specific user' })
  @ApiResponse({ status: 200, description: 'User time entries retrieved successfully' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() filterDto: TimeEntryFilterDto,
  ) {
    return this.timeEntryService.findByUser(userId, filterDto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get time entries for a specific project' })
  @ApiResponse({ status: 200, description: 'Project time entries retrieved successfully' })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query() filterDto: TimeEntryFilterDto,
  ) {
    return this.timeEntryService.findByProject(projectId, filterDto);
  }

  @Get('running/:userId')
  @ApiOperation({ summary: 'Get currently running time entry for user' })
  @ApiResponse({ status: 200, description: 'Running time entry retrieved' })
  async getRunningEntry(@Param('userId') userId: string) {
    return this.timeEntryService.getRunningEntry(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async findOne(@Param('id') id: string) {
    return this.timeEntryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
  ) {
    return this.timeEntryService.update(id, updateTimeEntryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async remove(@Param('id') id: string) {
    return this.timeEntryService.remove(id);
  }

  @Post(':id/start-timer')
  @ApiOperation({ summary: 'Start timer for time entry (resume)' })
  @ApiResponse({ status: 200, description: 'Timer started successfully' })
  async startTimer(@Param('id') id: string) {
    return this.timeEntryService.startTimer(id);
  }

  @Post(':id/stop-timer')
  @ApiOperation({ summary: 'Stop timer for time entry' })
  @ApiResponse({ status: 200, description: 'Timer stopped successfully' })
  async stopTimer(@Param('id') id: string) {
    return this.timeEntryService.stopTimer(id);
  }

  @Post('start-timer')
  @ApiOperation({ summary: 'Start a new timer' })
  @ApiResponse({ status: 201, description: 'Timer started successfully' })
  async startNewTimer(@Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.timeEntryService.startNewTimer(createTimeEntryDto);
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get time tracking statistics for user' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getUserStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntryService.getUserStats(userId, startDate, endDate);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve time entry' })
  @ApiResponse({ status: 200, description: 'Time entry approved successfully' })
  async approve(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.timeEntryService.approve(id, approvedBy);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject time entry' })
  @ApiResponse({ status: 200, description: 'Time entry rejected successfully' })
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectedBy: string; reason?: string },
  ) {
    return this.timeEntryService.reject(id, body.rejectedBy, body.reason);
  }
}