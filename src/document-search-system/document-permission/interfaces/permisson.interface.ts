import { AccessLevel, PermissionType } from "../enums/permission-type.enum";


export interface IPermission {
  documentId: string;
  userId: string;
  permissions: PermissionType[];
  accessLevel: AccessLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentAccess {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canAdmin: boolean;
}
