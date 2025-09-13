export interface SearchResult<T> {
  data: T[];
  pagination: PaginationInfo;
  filters: AppliedFilters;
  summary: SearchSummary;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AppliedFilters {
  types?: DocumentType[];
  statuses?: DocumentStatus[];
  tags?: string[];
  dateRange?: DateRange;
  sizeRange?: SizeRange;
  searchText?: string;
  folderId?: string;
  projectId?: string;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface SizeRange {
  min?: number;
  max?: number;
}

export interface SearchSummary {
  totalDocuments: number;
  totalSize: number;
  typeDistribution: TypeDistribution[];
  statusDistribution: StatusDistribution[];
  tagDistribution: TagDistribution[];
}

export interface TypeDistribution {
  type: DocumentType;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: DocumentStatus;
  count: number;
  percentage: number;
}

export interface TagDistribution {
  tag: string;
  count: number;
  percentage: number;
}

export interface DocumentSearchResult extends SearchResult<DocumentWithRelations> {
  aggregations: {
    totalSize: number;
    averageSize: number;
    oldestDocument: Date;
    newestDocument: Date;
  };
}
