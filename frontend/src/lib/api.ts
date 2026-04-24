import { API_BASE_URL } from "./config";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  method: ApiMethod,
  options?: { token?: string | null; body?: unknown },
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      (payload as { message?: string } | null)?.message || "Request failed",
      response.status,
      payload,
    );
  }
  return payload as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, "GET", { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, "POST", { body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, "PUT", { body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, "PATCH", { body, token }),
};

export { ApiError };
