const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

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

type CsrfResponse = {
  status: "success";
  data: {
    csrf_token: string;
  };
};

async function fetchCsrfToken() {
  const response = await fetch("/api/v1/csrf", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as CsrfResponse;

  return data.data.csrf_token;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  const { body, ...fetchOptions } = options;

  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const needsCsrfToken = !SAFE_METHODS.includes(method);

  if (needsCsrfToken && !headers.has("X-CSRF-Token")) {
    const csrfToken = await fetchCsrfToken();

    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(path, {
    ...fetchOptions,
    method,
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
