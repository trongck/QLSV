
// ─── Response Wrappers ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Pagination Params ────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

/** Loại bỏ các trường auto-generated khi tạo mới */
export type CreateInput<T, K extends keyof T = never> = Omit<
  T,
  "ngaytao" | "ngaycapnhat" | K
>;

/** Làm tất cả các trường thành optional (dùng cho PATCH) */
export type PartialUpdate<T, K extends keyof T = never> = Partial<Omit<T, K>>;

/** Lấy value của enum thành union type */
export type EnumValues<T extends Record<string, string>> = T[keyof T];