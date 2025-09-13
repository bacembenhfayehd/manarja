import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTemplateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Create UI Mockups'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the task',
    example: 'Design all main screens for the application',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Priority level of the task',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
    required: false
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Estimated hours to complete the task',
    example: 8.5,
    required: false
  })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({
    description: 'Order of the task within the phase',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}