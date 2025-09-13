import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateBrandingDto {
  @ApiProperty({
    example: '#4F46E5',
    description: 'Primary brand color in HEX format',
    required: false
  })
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({
    example: '#10B981',
    description: 'Secondary brand color in HEX format',
    required: false
  })
  @IsHexColor()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({
    example: '#F59E0B',
    description: 'Accent color in HEX format',
    required: false
  })
  @IsHexColor()
  @IsOptional()
  accentColor?: string;

  @ApiProperty({
    example: 'Inter, sans-serif',
    description: 'Font family for branding',
    required: false
  })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiProperty({
    example: '.btn { border-radius: 8px; }',
    description: 'Custom CSS for branding',
    required: false
  })
  @IsString()
  @IsOptional()
  customCss?: string;
}