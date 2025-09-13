import { ApiProperty } from '@nestjs/swagger';

export class BrandingResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
    description: 'Branding record ID'
  })
  id: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/logo.png',
    required: false
  })
  logoUrl?: string;

  @ApiProperty({
    example: '#4F46E5',
    required: false
  })
  primaryColor?: string;

  @ApiProperty({
    example: '#10B981',
    required: false
  })
  secondaryColor?: string;

  @ApiProperty({
    example: '#F59E0B',
    required: false
  })
  accentColor?: string;

  @ApiProperty({
    example: 'Inter, sans-serif',
    required: false
  })
  fontFamily?: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/favicon.ico',
    required: false
  })
  faviconUrl?: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'Last update timestamp'
  })
  updatedAt: Date;
}