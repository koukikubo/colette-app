import { notifySessionExpired } from "./session-events";
// CSRFトークンが不要な、安全なHTTPメソッド。
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// apiFetchで成功時に返すAPIレスポンスの共通形式。
export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
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

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readResponse(
  response: Response,
  notifyExpired = true,
  allowEmpty = false,
): Promise<unknown> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new ApiClientError(
      "応答を読み取れませんでした。保存結果を確認してください",
      502,
      [],
      "response_unreadable",
    );
  }
  let data: unknown = null;
  try {
    if (text) data = JSON.parse(text);
  } catch {
    /* HTML・壊れたJSONは成功と扱わない。 */
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      /(?:^|,)\s*Basic\b/i.test(response.headers.get("WWW-Authenticate") ?? "")
    )
      throw new ApiClientError(
        "接続先のアクセス認証が必要です。ブラウザーで認証を確認してください",
        401,
        [],
        "access_auth_required",
      );
    if (
      record(data) &&
      data.status === "error" &&
      typeof data.message === "string"
    ) {
      if (response.status === 401 && notifyExpired) notifySessionExpired();
      const errors =
        Array.isArray(data.errors) &&
        data.errors.every((value) => typeof value === "string")
          ? data.errors
          : record(data.errors) &&
              Object.values(data.errors).every(
                (value) =>
                  Array.isArray(value) &&
                  value.every((item) => typeof item === "string"),
              )
            ? (data.errors as Record<string, string[]>)
            : [];
      throw new ApiClientError(
        data.message,
        response.status,
        errors,
        typeof data.code === "string" ? data.code : undefined,
      );
    }
    throw new ApiClientError(
      "サーバーの応答を確認できませんでした",
      response.status,
      [],
      "unexpected_response",
    );
  }
  if (response.status === 204 && allowEmpty) return undefined;
  if (
    !record(data) ||
    data.status !== "success" ||
    !Object.hasOwn(data, "data")
  )
    throw new ApiClientError(
      "正常な応答を確認できませんでした。保存結果を確認してください",
      502,
      [],
      "invalid_response",
    );
  return data;
}

// ヘッダーだけでなく本文の読取まで期限を維持する。中断後も更新は自動再送しない。
async function requestResponse(
  path: string,
  options: RequestInit,
  notifyExpired = true,
  allowEmpty = false,
) {
  const controller = new AbortController();
  const external = options.signal;
  const abort = () => controller.abort();
  if (external?.aborted) abort();
  external?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 35_000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
    });
    return await readResponse(response, notifyExpired, allowEmpty);
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", abort);
  }
}

// Railsへの更新系リクエストで使用するCSRFトークンを取得する。
async function fetchCsrfToken() {
  const data = await requestResponse("/api/v1/csrf", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const token = (data as CsrfResponse | null)?.data?.csrf_token;
  if (typeof token !== "string" || token.length === 0) {
    throw new ApiClientError(
      "CSRFトークンを取得できませんでした",
      502,
      [],
      "invalid_response",
    );
  }
  return token;
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

  return (await requestResponse(
    path,
    {
      ...fetchOptions,
      method,
      headers,
      credentials: "include",
      // オブジェクトのbodyはJSON文字列へ変換して送信する。
      // FormDataはファイル送信などで使用するため変換しない。
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    },
    path !== "/api/v1/staff/login",
    method === "DELETE",
  )) as T;
}
