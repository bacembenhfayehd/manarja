import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTemplateTaskDto } from '../template-task/create-template-task.dto';


export class CreateTemplatePhaseDto {
  @ApiProperty({
    description: 'The name of the phase',
    example: 'Design Phase'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Optional description of the phase',
    example: 'Includes all design-related tasks',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Order of the phase in the template',
    example: 1
  })
  @IsNotEmpty()
  order: number;

  @ApiProperty({
    description: 'List of tasks in this phase',
    type: [CreateTemplateTaskDto],
    required: false
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateTaskDto)
  @IsOptional()
  tasks?: CreateTemplateTaskDto[];
}