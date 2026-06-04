export type ApiSuccessResponse<T> = {
  data: T;
  message?: string;
};

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: object | FormData;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  const { body, ...fetchOptions } = options;

  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...fetchOptions,
    headers,
    credentials: "include",
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiClientError("API request failed", response.status);
  }

  return data as T;
}
