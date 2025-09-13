import { IsEnum, IsUUID } from 'class-validator';
import { ProjectMemberRole } from '@prisma/client'; 

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}
