import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveTimesheetDto {
  @ApiProperty({
    description: 'user id owner of this timesheet',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsUUID()
  approverId: string;

  @ApiPropertyOptional({
    description: 'optionals comments',
    example: 'Timesheet approved. hours confirm to project.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'comments shoud be < 1000 caractères'
  })
  comments?: string;
}

export class RejectTimesheetDto {
  @ApiProperty({
    description: 'id of user how rejected timesheet',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsUUID()
  rejectorId: string;

  @ApiProperty({
    description: 'comments (reason of rejection)',
    example: 'hours not confirm planning. correct entrie for 15/01.',
    maxLength: 1000
  })
  @IsString()
  @MaxLength(1000, {
    message: 'comments shoud be < 1000 caractères'
  })
  comments: string;
}