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
  Put,
} from '@nestjs/common';
import { ProjectTasksService } from '../services/project-tasks.service';
import { CreateProjectTaskDto } from '../dto/task/create-project-task.dto';
import { UpdateProjectTaskDto } from '../dto/task/update-project-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../guards/project-ownership.guard';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { AddTaskCommentDto } from '../dto/task/add-task-comment.dto';
import { UpdateTaskStatusDto } from '../dto/task/update-task-status.dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, ProjectOwnershipGuard)
export class ProjectTasksController {
  constructor(private readonly projectTasksService: ProjectTasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId') projectId: string,
    @Body() createProjectTaskDto: CreateProjectTaskDto,
    @Request() req,
  ) {
    return this.projectTasksService.create(
      projectId,
      createProjectTaskDto,
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('parentTaskId') parentTaskId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: 'dueDate' | 'priority' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters = {
      status,
      priority,
      assignedTo,
      parentTaskId,
    };

    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    };

    const sorting = {
      sortBy: sortBy || 'dueDate',
      sortOrder: sortOrder || 'asc',
    };

    return this.projectTasksService.findAll(
      projectId,
      filters,
      pagination,
      sorting,
    );
  }

  @Get('my-tasks')
  async findMyTasks(@Param('projectId') projectId: string, @Request() req) {
    return this.projectTasksService.findUserTasks(projectId, req.user.id);
  }

  @Get('overdue')
  async findOverdue(@Param('projectId') projectId: string) {
    return this.projectTasksService.findOverdue(projectId);
  }

  @Get('upcoming')
  async findUpcoming(
    @Param('projectId') projectId: string,
    @Query('days') days?: number,
  ) {
    const daysAhead = days ? Number(days) : 7;
    return this.projectTasksService.findUpcoming(projectId, daysAhead);
  }

  @Get('by-priority/:priority')
  async findByPriority(
    @Param('projectId') projectId: string,
    @Param('priority') priority: TaskPriority,
  ) {
    return this.projectTasksService.findByPriority(projectId, priority);
  }

  @Get('subtasks/:parentTaskId')
  async findSubtasks(
    @Param('projectId') projectId: string,
    @Param('parentTaskId') parentTaskId: string,
  ) {
    return this.projectTasksService.findSubtasks(projectId, parentTaskId);
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.projectTasksService.findOne(projectId, id);
  }

  @Get(':id/subtasks')
  async findTaskSubtasks(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.projectTasksService.findTaskSubtasks(projectId, id);
  }

  @Get(':id/dependencies')
  async findTaskDependencies(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.projectTasksService.findTaskDependencies(projectId, id);
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateProjectTaskDto: UpdateProjectTaskDto,
    @Request() req,
  ) {
    return this.projectTasksService.update(
      projectId,
      id,
      updateProjectTaskDto,
      req.user.id,
    );
  }

@Patch(':id/status')
  async updateStatuss(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.projectTasksService.updateStatus(
      projectId,
      id,
      updateStatusDto,
      req.user.id,
    );
  }

  @Patch(':id/assign')
  async assignTask(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('assignedTo') assignedTo: string,
    @Request() req,
  ) {
    return this.projectTasksService.assignTask(
      projectId,
      id,
      assignedTo,
      req.user.id,
    );
  }

  @Patch(':id/unassign')
  async unassignTask(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectTasksService.unassignTask(projectId, id, req.user.id);
  }

  @Patch(':id/priority')
  async updatePriority(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('priority') priority: TaskPriority,
    @Request() req,
  ) {
    return this.projectTasksService.updatePriority(
      projectId,
      id,
      priority,
      req.user.id,
    );
  }

  @Post(':id/start')
  async startTask(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectTasksService.startTask(projectId, id, req.user.id);
  }

  @Post(':id/complete')
  async completeTask(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectTasksService.completeTask(projectId, id, req.user.id);
  }

  @Post(':id/duplicate')
  async duplicateTask(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectTasksService.duplicateTask(projectId, id, req.user.id);
  }

  @Post(':id/dependencies')
  async addDependency(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('dependsOnTaskId') dependsOnTaskId: string,
    @Request() req,
  ) {
    return this.projectTasksService.addDependency(
      projectId,
      id,
      dependsOnTaskId,
      req.user.id,
    );
  }

  @Delete(':id/dependencies/:dependencyId')
  async removeDependency(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('dependencyId') dependencyId: string,
    @Request() req,
  ) {
    return this.projectTasksService.removeDependency(
      projectId,
      id,
      dependencyId,
      req.user.id,
    );
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.projectTasksService.remove(projectId, id, req.user.id);
  }

  @Post('bulk-update')
  async bulkUpdate(
    @Param('projectId') projectId: string,
    @Body('taskIds') taskIds: string[],
    @Body('updates') updates: Partial<UpdateProjectTaskDto>,
    @Request() req,
  ) {
    return this.projectTasksService.bulkUpdate(
      projectId,
      taskIds,
      updates,
      req.user.id,
    );
  }


  
  @Put(':id/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.projectTasksService.updateStatus(
      projectId,
      id,
      updateStatusDto,
      req.user.sub,
    );
  }

  
  @Post(':id/comments')
  async addComment(
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() addCommentDto: AddTaskCommentDto,
    @Request() req,
  ) {
    return this.projectTasksService.addComment(
      projectId,
      taskId,
      addCommentDto,
      req.user.sub,
    );
  }

  
  @Get(':id/status-history')
  async getStatusHistory(
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Request() req,
  ) {
    return this.projectTasksService.getStatusHistory(
      projectId,
      taskId,
      req.user.sub,
    );
  }

 
  @Get(':id/comments')
  async getComments(
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Request() req,
  ) {
    return this.projectTasksService.getComments(
      projectId,
      taskId,
      req.user.sub,
    );
  }

  
  @Put(':taskId/comments/:commentId')
  async updateComment(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.projectTasksService.updateComment(
      projectId,
      taskId,
      commentId,
      content,
      req.user.sub,
    );
  }

 
  @Delete(':taskId/comments/:commentId')
  async deleteComment(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.projectTasksService.deleteComment(
      projectId,
      taskId,
      commentId,
      req.user.sub,
    );
  }

}