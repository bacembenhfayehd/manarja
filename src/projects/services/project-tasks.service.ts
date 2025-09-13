import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectTaskDto } from '../dto/task/create-project-task.dto';
import { UpdateProjectTaskDto } from '../dto/task/update-project-task.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { AddTaskCommentDto } from '../dto/task/add-task-comment.dto';
import { UpdateTaskStatusDto } from '../dto/task/update-task-status.dto';

@Injectable()
export class ProjectTasksService {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, userId: string) {
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  async create(projectId: string, createProjectTaskDto: CreateProjectTaskDto, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const {
    title,
    description,
    priority,
    dueDate,
    estimatedHours,
    assignedTo,
    parentTaskId,
    phaseId,
  } = createProjectTaskDto;

 const task = await this.prisma.task.create({
    data: {
      title,
      projectId,
      status: TaskStatus.TODO,
      ...(description && { description }),
      ...(priority && { priority }),
      ...(dueDate && { dueDate }),
      ...(estimatedHours && { estimatedHours }),
      ...(assignedTo && { assignedTo }),
      ...(parentTaskId && { parentTaskId }),
      ...(phaseId && { phaseId }),
    },
    include: {
      assignedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      parentTask: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return task;
}

  async findAll(projectId: string, filters: any, pagination: any, sorting: any) {
    const where: any = { projectId };
    
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.parentTaskId) where.parentTaskId = filters.parentTaskId;

    const orderBy: any = {};
    if (sorting.sortBy) {
      orderBy[sorting.sortBy] = sorting.sortOrder;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              subtasks: true,
            },
          },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findOne(projectId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    if (!task || task.projectId !== projectId) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async findUserTasks(projectId: string, userId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        assignedTo: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findOverdue(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: TaskStatus.COMPLETED,
        },
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findUpcoming(projectId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.task.findMany({
      where: {
        projectId,
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
        status: {
          in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        },
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findByPriority(projectId: string, priority: TaskPriority) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        priority,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findSubtasks(projectId: string, parentTaskId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        parentTaskId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findTaskSubtasks(projectId: string, id: string) {
    await this.findOne(projectId, id); 
    return this.prisma.task.findMany({
      where: {
        parentTaskId: id,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findTaskDependencies(projectId: string, id: string) {
    const task = await this.findOne(projectId, id);
    if (!task.dependencies) return [];
    
    const dependencyIds = task.dependencies as string[];
    return this.prisma.task.findMany({
      where: {
        id: { in: dependencyIds },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
    });
  }

async update(projectId: string, id: string, updateProjectTaskDto: UpdateProjectTaskDto, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const existingTask = await this.findOne(projectId, id);
    
    if (existingTask.status === TaskStatus.COMPLETED && updateProjectTaskDto.status !== TaskStatus.COMPLETED) {
      throw new ForbiddenException('Cannot modify a completed task');
    }

    // if
    if (updateProjectTaskDto.status && updateProjectTaskDto.status !== existingTask.status) {
      await this.createStatusLog(id, userId, existingTask.status, updateProjectTaskDto.status);
    }

    return this.prisma.task.update({
      where: { id },
      data: updateProjectTaskDto,
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

    async updateStatus(projectId: string, id: string, updateStatusDto: UpdateTaskStatusDto, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const existingTask = await this.findOne(projectId, id);

    //verify if task can be modified
    if (existingTask.status === TaskStatus.COMPLETED && updateStatusDto.status !== TaskStatus.COMPLETED) {
      throw new ForbiddenException('Cannot modify a completed task');
    }

    // transcations
    return this.prisma.$transaction(async (prisma) => {
      // update task status
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: updateStatusDto.status },
        include: {
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // create log change status
      await this.createStatusLog(
        id, 
        userId, 
        existingTask.status, 
        updateStatusDto.status, 
        updateStatusDto.comment
      );

      return updatedTask;
    });
  }



  
  // create log change status
  private async createStatusLog(
    taskId: string,
    userId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
    comment?: string
  ) {
    return this.prisma.taskStatusLog.create({
      data: {
        taskId,
        userId,
        oldStatus,
        newStatus,
        comment,
      },
    });
  }

  // Add comment to task
  async addComment(projectId: string, taskId: string, addCommentDto: AddTaskCommentDto, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, taskId);

    return this.prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: addCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // get task history status
  async getStatusHistory(projectId: string, taskId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, taskId);

    return this.prisma.taskStatusLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // get task comments
  async getComments(projectId: string, taskId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, taskId);

    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  //update comment only with owner
  async updateComment(projectId: string, taskId: string, commentId: string, content: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, taskId);

    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    return this.prisma.taskComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // delete a comment (only by owner)
  async deleteComment(projectId: string, taskId: string, commentId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, taskId);

    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.taskComment.delete({
      where: { id: commentId },
    });
  }


  async assignTask(projectId: string, id: string, assignedTo: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, id);

    
    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: assignedTo,
      },
    });

    if (!isMember) {
      throw new ForbiddenException('Cannot assign task to non-project member');
    }

    return this.prisma.task.update({
      where: { id },
      data: { assignedTo },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async unassignTask(projectId: string, id: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, id);

    return this.prisma.task.update({
      where: { id },
      data: { assignedTo: null },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updatePriority(projectId: string, id: string, priority: TaskPriority, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, id);

    return this.prisma.task.update({
      where: { id },
      data: { priority },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async startTask(projectId: string, id: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const task = await this.findOne(projectId, id);

    if (task.status !== TaskStatus.TODO) {
      throw new ForbiddenException('Only tasks in TODO status can be started');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.IN_PROGRESS },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async completeTask(projectId: string, id: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const task = await this.findOne(projectId, id);

    if (task.status === TaskStatus.COMPLETED) {
      throw new ForbiddenException('Task is already completed');
    }

    return this.prisma.task.update({
      where: { id },
      data: { 
        status: TaskStatus.COMPLETED,
        actualHours: task.estimatedHours, 
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async duplicateTask(projectId: string, id: string, userId: string) {
  await this.checkProjectAccess(projectId, userId);

  const task = await this.findOne(projectId, id);

  const newTask = await this.prisma.task.create({
    data: {
      title: `Copy of ${task.title}`,
      projectId: task.projectId,
      phaseId: task.phaseId,
      status: TaskStatus.TODO, 
      priority: task.priority,
      dueDate: task.dueDate ?? undefined,
      estimatedHours: task.estimatedHours ?? undefined,
      parentTaskId: task.parentTaskId ?? undefined,
      dependencies: task.dependencies ?? undefined,
      description: task.description ?? undefined,
      assignedTo: null, 
    },
    include: {
      assignedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return newTask;
}

  async addDependency(projectId: string, id: string, dependsOnTaskId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const task = await this.findOne(projectId, id);
    await this.findOne(projectId, dependsOnTaskId); 

    const currentDependencies = task.dependencies ? task.dependencies as string[] : [];
    if (currentDependencies.includes(dependsOnTaskId)) {
      throw new ForbiddenException('Dependency already exists');
    }

    const updatedDependencies = [...currentDependencies, dependsOnTaskId];

    return this.prisma.task.update({
      where: { id },
      data: { dependencies: updatedDependencies },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async removeDependency(projectId: string, id: string, dependencyId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    const task = await this.findOne(projectId, id);

    const currentDependencies = task.dependencies ? task.dependencies as string[] : [];
    if (!currentDependencies.includes(dependencyId)) {
      throw new ForbiddenException('Dependency does not exist');
    }

    const updatedDependencies = currentDependencies.filter(depId => depId !== dependencyId);

    return this.prisma.task.update({
      where: { id },
      data: { dependencies: updatedDependencies },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(projectId: string, id: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);
    await this.findOne(projectId, id);

    
    const subtasks = await this.prisma.task.count({
      where: { parentTaskId: id },
    });

    if (subtasks > 0) {
      throw new ForbiddenException('Cannot delete task with subtasks');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async bulkUpdate(projectId: string, taskIds: string[], updates: Partial<UpdateProjectTaskDto>, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    
    const tasksCount = await this.prisma.task.count({
      where: {
        id: { in: taskIds },
        projectId,
      },
    });

    if (tasksCount !== taskIds.length) {
      throw new ForbiddenException('Some tasks do not belong to this project');
    }

    return this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: updates,
    });
  }
}