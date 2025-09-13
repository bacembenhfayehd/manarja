export interface Document {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  path: string;
  url?: string;
  size: number;
  type: DocumentType;
  status: DocumentStatus;
  isPublic: boolean;
  notes?: string;
  
  
  userId: string;
  folderId?: string;
  projectId?: string;
  
  
  createdAt: Date;
  updatedAt: Date;
  
 
  user?: User;
  folder?: Folder;
  project?: Project;
  tags?: Tag[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  projectId?: string;
  color?: string;
  isPublic: boolean;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  category?: string;
}

export enum DocumentType {
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  OTHER = 'other'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PRIVATE = 'private'
}

export interface DocumentWithRelations extends Document {
  user: User;
  folder?: Folder;
  project?: Project;
  tags: Tag[];
}