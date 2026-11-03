export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  items?: T[];
  content?: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first?: boolean;
  empty?: boolean;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
}
