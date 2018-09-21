export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}
