export interface DocumentFilter {
  
  types?: DocumentType[];
  statuses?: DocumentStatus[];
  
  
  folderIds?: string[];
  projectIds?: string[];
  
 
  tags?: string[];
  createdByUsers?: string[];
  
 
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  
  
  minSizeBytes?: number;
  maxSizeBytes?: number;
  
  
  searchText?: string;
  titleContains?: string;
  descriptionContains?: string;
  
  
  isPublic?: boolean;
  hasPreview?: boolean;
  
  
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

export interface DocumentSort {
  field: DocumentSortField;
  direction: SortDirection;
}

export enum DocumentSortField {
  TITLE = 'title',
  FILENAME = 'filename',
  SIZE = 'size',
  TYPE = 'type',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CREATED_BY = 'createdBy'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface DocumentPagination {
  page: number;
  limit: number;
  offset?: number;
}

export interface DocumentQuery {
  filter: DocumentFilter;
  sort: DocumentSort;
  pagination: DocumentPagination;
}

export interface FilterOptions {
  availableTypes: DocumentType[];
  availableStatuses: DocumentStatus[];
  availableTags: Tag[];
  availableFolders: Folder[];
  availableProjects: Project[];
  sizeRange: {
    min: number;
    max: number;
  };
  dateRange: {
    min: Date;
    max: Date;
  };
}


export interface DocumentListResponse {
  documents: DocumentWithRelations[];
  pagination: PaginationInfo;
  filters: AppliedFilters;
}

export interface DocumentStatsResponse {
  totalDocuments: number;
  totalSize: number;
  averageSize: number;
  typeDistribution: TypeDistribution[];
  statusDistribution: StatusDistribution[];
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'shared';
  documentId: string;
  documentTitle: string;
  userId: string;
  userName: string;
  timestamp: Date;
}
