export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String((data as { error: unknown }).error)) ||
      `İstek başarısız (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}
