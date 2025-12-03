export interface IResponse<T> {
  data?: T;
  errors?: ApiError[];
  success: boolean;
  paging?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  field?: string;
  key?: string;
}
