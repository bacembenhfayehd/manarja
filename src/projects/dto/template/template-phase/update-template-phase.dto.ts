import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplatePhaseDto } from './create-template-phase.dto';
import { UpdateTemplateTaskDto } from '../template-task/update-template-task.dto';


export class UpdateTemplatePhaseDto extends PartialType(CreateTemplatePhaseDto) {
  @ApiProperty({
    description: 'Updated name of the phase',
    example: 'Updated Design Phase',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Updated order of the phase',
    example: 2,
    required: false
  })
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Updated list of tasks',
    type: [UpdateTemplateTaskDto],
    required: false
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateTemplateTaskDto)
  @IsOptional()
  updatedTasks?: UpdateTemplateTaskDto[]; // bech narja3lha fel logic ba3ed  (tasks?)
}