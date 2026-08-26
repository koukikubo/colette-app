// CSRFトークンが不要な、安全なHTTPメソッド。
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// apiFetchで成功時に返すAPIレスポンスの共通形式。
export type ApiSuccessResponse<T> = {
  data: T;
  message?: string;
  errors?: string;
};
export type ApiFieldErrors = Record<string, string[]>;
export type ApiErrorDetails = string[] | ApiFieldErrors;
export type ApiErrorResponse = {
  status: "error";
  message: string;
  errors: ApiErrorDetails;
  code?: string;
};

// APIクライアントのエラーを表す例外クラス。
export class ApiClientError extends Error {
  status: number;
  errors: ApiErrorDetails;
  code?: string;

  constructor(
    message: string,
    status: number,
    errors: ApiErrorDetails = [],
    code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
  // errorsが配列かオブジェクトかに関わらず、すべてのエラーメッセージを1つの配列として返す。
  get errorMessages(): string[] {
    return Array.isArray(this.errors)
      ? this.errors
      : Object.values(this.errors).flat();
  }
}
// fetchの設定に、オブジェクトまたはFormDataを本文として渡せるようにした型。
// オブジェクトはapiFetch内でJSON文字列へ変換する。
type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: object | FormData;
};

type CsrfResponse = {
  status: "success";
  data: {
    csrf_token: string;
  };
};

// Railsへの更新系リクエストで使用するCSRFトークンを取得する。
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

// Next.jsのAPI Proxy経由でRails APIを呼び出す共通関数。
// JSON変換・CSRFトークン付与・エラーレスポンスの例外化をまとめて行う。
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  // bodyだけを取り出し、残りのfetch設定を分ける。
  const { body, ...fetchOptions } = options;
  // FormDataの場合はJSONへ変換せず、そのまま送信する。
  const isFormData = body instanceof FormData;
  // オブジェクトをJSONとして送る場合のみContent-Typeを設定する。
  if (body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  // POST・PATCH・DELETEなどの更新系リクエストにはCSRFトークンを付与する。
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
    // オブジェクトのbodyはJSON文字列へ変換して送信する。
    // FormDataはファイル送信などで使用するため変換しない。
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse | null;

    throw new ApiClientError(
      errorResponse?.message ?? "API response failed",
      response.status,
      errorResponse?.errors ?? [],
      errorResponse?.code,
    );
  }

  return data as T;
}
