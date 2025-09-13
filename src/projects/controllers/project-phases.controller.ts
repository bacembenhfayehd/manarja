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
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProjectPhasesService } from '../services/project-phases.service';
import { CreateProjectPhaseDto } from '../dto/phase/create-project-phase.dto';
import { UpdateProjectPhaseDto } from '../dto/phase/update-project-phase.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../guards/project-ownership.guard';
import { MilestoneStatus } from '@prisma/client';

@Controller('projects/:projectId/phases')
@UseGuards(JwtAuthGuard, ProjectOwnershipGuard)
export class ProjectPhasesController {
  constructor(private readonly projectPhasesService: ProjectPhasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId') projectId: string,
    @Body() createProjectPhaseDto: CreateProjectPhaseDto,
    @Request() req,
  ) {
    return this.projectPhasesService.create(
      projectId,
      createProjectPhaseDto,
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: MilestoneStatus,
    @Query('sortBy') sortBy?: 'dueDate' | 'createdAt' | 'name',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters = { status };
    const sorting = {
      sortBy: sortBy || 'dueDate',
      sortOrder: sortOrder || 'asc',
    };

    return this.projectPhasesService.findAll(projectId, filters, sorting);
  }

  @Get('upcoming')
  async findUpcoming(@Param('projectId') projectId: string) {
    return this.projectPhasesService.findUpcoming(projectId);
  }

  @Get('overdue')
  async findOverdue(@Param('projectId') projectId: string) {
    return this.projectPhasesService.findOverdue(projectId);
  }

  @Get('progress')
  async getProjectProgress(@Param('projectId') projectId: string) {
    return this.projectPhasesService.getProjectProgress(projectId);
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.projectPhasesService.findOne(projectId, id);
  }

  @Get(':id/tasks')
  async findPhaseTasks(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.projectPhasesService.findPhaseTasks(id, { status });
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateProjectPhaseDto: UpdateProjectPhaseDto,
    @Request() req,
  ) {
    return this.projectPhasesService.update(
      projectId,
      id,
      updateProjectPhaseDto,
      req.user.id,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('status') status: MilestoneStatus,
    @Request() req,
  ) {
    return this.projectPhasesService.updateStatus(
      projectId,
      id,
      status,
      req.user.id,
    );
  }

  @Patch(':id/progress')
  async updateProgress(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('percentageComplete') percentageComplete: number,
    @Request() req,
  ) {
    return this.projectPhasesService.updateProgress(
      projectId,
      id,
      percentageComplete,
      req.user.id,
    );
  }

  @Post(':id/complete')
  async complete(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectPhasesService.complete(projectId, id, req.user.id);
  }

  @Post(':id/reopen')
  async reopen(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectPhasesService.reopen(projectId, id, req.user.id);
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectPhasesService.remove(projectId, id, req.user.id);
  }

  @Post('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Body('phaseIds') phaseIds: string[],
    @Request() req,
  ) {
    return this.projectPhasesService.reorder(projectId, phaseIds, req.user.id);
  }
}