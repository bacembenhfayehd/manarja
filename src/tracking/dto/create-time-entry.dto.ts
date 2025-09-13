import { IsString, IsDateString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateTimeEntryDto {
   @IsString()
  userId: string; 

  @IsDateString()
  date: string; // Format ISO: "2025-07-20T00:00:00.000Z"

   @IsDateString()
  startTime: string; 

   @IsDateString()
  endTime: string; 


  @IsNumber()
  @Min(0.1)
  hours: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}
