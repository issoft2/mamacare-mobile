/**
 * packages/api/src/client.ts
 *
 * Base API client. Reads API_URL from environment.
 * Attaches Bearer token from Clerk on every request.
 */

import type { ApiError } from "@safeborn/types";

export type TokenGetter = () => Promise<string | null>;

let _getToken: TokenGetter = async () => null;

export function configureApiClient(getToken: TokenGetter): void {
  _getToken = getToken;
}

/**
 * Optional base URL set by the host app (Expo, tests). Prefer this over reading
 * process.env inside @safeborn/api: the published package is precompiled (dist/),
 * and Metro does not inline EXPO_PUBLIC_* in node_modules, so env-based lookup
 * falls through to localhost for Expo Web / native unless overridden here.
 */
let _baseUrlOverride: string | null = null;

export function configureApiBaseUrl(baseUrl: string): void {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  _baseUrlOverride = trimmed.length > 0 ? trimmed : null;
}

async function getBaseUrl(): Promise<string> {
  if (_baseUrlOverride) {
    return _baseUrlOverride;
  }
  // Next (admin) must take precedence in monorepos where both envs exist: EXPO_ is
  // for the mobile app; a shared .env can otherwise make the web app hit the wrong host.
  // React Native/Expo builds typically do not set NEXT_PUBLIC_* so EXPO_ still wins there.
  const url =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
    "http://localhost:80";
  return url;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = await getBaseUrl();
  const token = await _getToken();
  const optionHeaders = options.headers as Record<string, string> | undefined;
  const headers: Record<string, string> = {
    ...(optionHeaders ?? {}),
  };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: "UNKNOWN_ERROR", message: response.statusText },
    }));
    throw new ApiRequestError(response.status, error);
  }

  return response;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError
  ) {
    super(body.error?.message ?? "API request failed");
    this.name = "ApiRequestError";
  }

  get code(): string {
    return this.body.error?.code ?? "UNKNOWN_ERROR";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isPlanRequired(): boolean {
    return this.code === "PLAN_REQUIRED";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
