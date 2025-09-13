import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateTaskDto } from './create-template-task.dto';

export class UpdateTemplateTaskDto extends PartialType(CreateTemplateTaskDto) {
  @ApiProperty({
    description: 'Updated title of the task',
    example: 'Updated UI Mockups',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Updated priority level',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    required: false
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Updated estimated hours',
    example: 10,
    required: false
  })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;
}