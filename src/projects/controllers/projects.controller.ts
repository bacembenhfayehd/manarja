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
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto } from '../dto/project/create-project.dto';
import { UpdateProjectDto } from '../dto/project/update-project.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../guards/project-ownership.guard';
import { ProjectStatus, ProjectType } from '@prisma/client';
import { AddMemberDto } from '../dto/addMember.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('status') status?: ProjectStatus,
    @Query('type') type?: ProjectType,
    @Query('companyId') companyId?: string,
    @Query('managerId') managerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    const filters = {
      status,
      type,
      companyId,
      managerId,
      userId: req.user.id,
    };
    
    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    return this.projectsService.findAll(filters, pagination);
  }

  @Get('my-projects')
  async findMyProjects(@Request() req) {
    return this.projectsService.findUserProjects(req.user.id);
  }

  @Get('company/:companyId')
  async findByCompany(@Param('companyId') companyId: string, @Request() req) {
    return this.projectsService.findByCompany(companyId, req.user.id);
  }

  @Get(':id')
  @UseGuards(ProjectOwnershipGuard)
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/details')
  @UseGuards(ProjectOwnershipGuard)
  async findOneWithDetails(@Param('id') id: string) {
    return this.projectsService.findOneWithDetails(id);
  }

  @Get(':id/members')
  @UseGuards(ProjectOwnershipGuard)
  async findProjectMembers(@Param('id') id: string) {
    return this.projectsService.findProjectMembers(id);
  }

  @Get(':id/tasks')
  @UseGuards(ProjectOwnershipGuard)
  async findProjectTasks(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.projectsService.findProjectTasks(id, { status, assignedTo });
  }

  @Get(':id/milestones')
  @UseGuards(ProjectOwnershipGuard)
  async findProjectMilestones(@Param('id') id: string) {
    return this.projectsService.findProjectMilestones(id);
  }

  @Get(':id/progress')
  @UseGuards(ProjectOwnershipGuard)
  async getProjectProgress(@Param('id') id: string) {
    return this.projectsService.getProjectProgress(id);
  }

  @Patch(':id')
  @UseGuards(ProjectOwnershipGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(ProjectOwnershipGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProjectStatus,
    @Request() req,
  ) {
    return this.projectsService.updateStatus(id, status, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(ProjectOwnershipGuard)
  async addMember(
    @Param('id') id: string,
     @Body() addMemberDto: AddMemberDto,
    @Body('role') role: string,
    @Request() req,
  ) {
    return this.projectsService.addMember(id,  addMemberDto.userId, addMemberDto.role, req.user.id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ProjectOwnershipGuard)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.projectsService.removeMember(id, userId, req.user.id);
  }

  @Delete(':id')
  @UseGuards(ProjectOwnershipGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(ProjectOwnershipGuard)
  async archive(@Param('id') id: string, @Request() req) {
    return this.projectsService.archive(id, req.user.id);
  }

  @Post(':id/restore')
  @UseGuards(ProjectOwnershipGuard)
  async restore(@Param('id') id: string, @Request() req) {
    return this.projectsService.restore(id, req.user.id);
  }
}