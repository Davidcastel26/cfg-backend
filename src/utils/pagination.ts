export type SortOrder = 'ASC' | 'DESC';

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface CatalogFilters extends PageParams {
  search?: string;
  sortBy?: 'code' | 'name' | 'createdAt';
  sortOrder?: SortOrder;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function paginated<T>(data: T[], page: number, pageSize: number, total: number): Paginated<T> {
  return {
    data,
    pagination: { page, pageSize, total, totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0 },
  };
}
