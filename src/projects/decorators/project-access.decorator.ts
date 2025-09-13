import { SetMetadata } from '@nestjs/common';

export enum ProjectAccessLevel {
  VIEWER = 'VIEWER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER'
}

export const ProjectAccess = (accessLevel: ProjectAccessLevel) => 
  SetMetadata('projectAccess', accessLevel);