import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTakeoffItemDto } from './create-takeoff-item.dto';

export class CreateTakeoffDto {
  @ApiProperty({ description: 'Takeoff name', example: 'Kitchen Renovation - Phase 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Takeoff description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Room/Area', example: 'Kitchen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @ApiPropertyOptional({ description: 'Trade/Phase', example: 'Flooring' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trade?: string;

  @ApiProperty({ description: 'Takeoff items', type: [CreateTakeoffItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTakeoffItemDto)
  takeoffItems: CreateTakeoffItemDto[];
}
