import { SetMetadata } from '@nestjs/common';

export const REPORT_ACCESS_KEY = 'reportAccess';

export enum ReportAccessLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin'
}

export const ReportAccess = (levels: ReportAccessLevel[]) => 
  SetMetadata(REPORT_ACCESS_KEY, levels);

// Usage examples:
// @ReportAccess([ReportAccessLevel.READ])
// @ReportAccess([ReportAccessLevel.WRITE, ReportAccessLevel.DELETE])
// @ReportAccess([ReportAccessLevel.ADMIN])