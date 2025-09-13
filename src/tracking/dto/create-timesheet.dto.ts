import { IsString, IsUUID, IsDateString, IsNotEmpty, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { isAfter } from 'date-fns';


export class CreateTimesheetDto {
  @ApiProperty({
    description: 'user id owner of timesheet',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'end week date',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsNotEmpty()
  weekStart: string;

  @ApiProperty({
    description: 'end week date',
    example: '2024-01-07T23:59:59.999Z'
  })
  @IsDateString()
  @IsNotEmpty()
  @Validate(isAfter, ['weekStart'], {
    message: 'end date should be > start date'
  })
  weekEnd: string;
}