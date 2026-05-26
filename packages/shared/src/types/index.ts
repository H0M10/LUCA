export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiOk<T> {
  data: T;
}

export type ApiResponse<T> = ApiOk<T> | { error: ApiError };

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  db: 'up' | 'down';
  timestamp: string;
}
