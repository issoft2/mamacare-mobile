/**
 * Common types shared across all safeborn AI services.
 * Mirrors shared Python Pydantic base schemas.
 */

export type UUID = string;
export type ISODateString = string;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
    resource_id?: string;
    request_id?: string;
    required_plan?: string;
  };
}

export type Jurisdiction = "GB" | "NG";
export type Language = "en" | "yo" | "ha" | "ig" | "pcm";
