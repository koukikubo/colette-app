/**
 * API通信が成功したときの共通レスポンス型
 *
 * Rails側では render_success 経由で
 * { status: "success", data: ... }
 * の形式で返す想定。
 */
export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

/**
 * API通信が失敗したときの共通レスポンス型
 *
 * Rails側では render_error 経由で
 * { status: "error", message: "..." }
 * の形式で返す想定。
 */
export type ApiErrorResponse = {
  status: "error";
  message: string;
  errors?: unknown;
};

/**
 * apiFetch に渡す option 型
 *
 * 通常の fetch の RequestInit をベースにしつつ、
 * body は apiFetch 側で JSON.stringify できるように unknown にしている。
 *
 * これにより、呼び出し側では JSON.stringify を毎回書かずに済む。
 */
type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/**
 * CSRF token API のレスポンス型
 *
 * GET /api/v1/csrf の戻り値を想定。
 */
type CsrfResponse = ApiSuccessResponse<{
  csrf_token: string;
}>;

/**
 * apiFetch で発生したAPIエラーを表す独自Errorクラス
 *
 * status code や response body を保持することで、
 * 呼び出し側でエラー内容を判定しやすくする。
 */
export class ApiClientError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

/**
 * CSRF token を取得するための Next.js Route Handler
 *
 * Browser から Rails API を直接叩かず、
 * Next.js Route Handler 経由で取得する。
 */
const CSRF_PATH = "/api/v1/csrf";

/**
 * CSRF token が不要なHTTPメソッドかどうかを判定する。
 *
 * GET / HEAD はデータ変更を行わない安全なメソッドなので、
 * CSRF token を付与しない。
 */
function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD";
}

/**
 * response body を JSON として parse する。
 *
 * ただし、204 No Content や空文字レスポンスの場合もあるため、
 * JSON parse に失敗しても例外にせず null を返す。
 */
async function parseJsonOrNull(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Rails の CSRF token を取得する。
 *
 * POST / PATCH / DELETE などの破壊的リクエストを送る前に呼び出す。
 *
 * 注意:
 * Rails側の login 処理で reset_session する可能性があるため、
 * まずは token をキャッシュせず、必要なタイミングで毎回取得する。
 */
async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_PATH, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const json = (await parseJsonOrNull(
    response,
  )) as Partial<CsrfResponse> | null;

  if (!response.ok) {
    throw new ApiClientError(
      "CSRF token の取得に失敗しました",
      response.status,
      json,
    );
  }

  const csrfToken = json?.data?.csrf_token;

  if (!csrfToken) {
    throw new Error("CSRF token がレスポンスに含まれていません");
  }

  return csrfToken;
}

/**
 * Client Component から利用する共通API通信関数。
 *
 * 役割:
 * - Browser から Next.js Route Handler の /api/v1/... を叩く
 * - JSON request / response を共通化する
 * - 非GET/HEAD request 時に CSRF token を自動付与する
 * - session cookie を送るため credentials: "include" を指定する
 * - APIエラー時に ApiClientError として throw する
 *
 * 注意:
 * この関数は Rails API を直接叩かない。
 * 必ず Next.js Route Handler 経由の path を指定する。
 *
 * 例:
 * apiFetch("/api/v1/csrf")
 * apiFetch("/api/v1/staff/login", {
 *   method: "POST",
 *   body: {
 *     staff: {
 *       staff_id: 1,
 *       password: "password",
 *     },
 *   },
 * })
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    body: requestBody,
    headers: optionHeaders,
    method: optionMethod = "GET",
    ...restOptions
  } = options;

  const method = optionMethod.toUpperCase();

  /**
   * 呼び出し側から渡された headers を引き継ぎつつ、
   * JSON API として扱うため Accept を設定する。
   */
  const headers = new Headers(optionHeaders);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;

  /**
   * GET / HEAD には request body を付けない。
   *
   * POST / PATCH / DELETE などで body が渡された場合のみ、
   * JSON.stringify して送信する。
   */
  if (requestBody !== undefined && !isSafeMethod(method)) {
    if (typeof requestBody === "string") {
      body = requestBody;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      body = JSON.stringify(requestBody);
    }
  }

  /**
   * POST / PATCH / DELETE などの破壊的リクエストでは、
   * Rails の CSRF 検証を通すため X-CSRF-Token を付与する。
   */
  if (!isSafeMethod(method)) {
    const csrfToken = await fetchCsrfToken();
    headers.set("X-CSRF-Token", csrfToken);
  }

  /**
   * Browser から Next.js Route Handler へリクエストする。
   *
   * credentials: "include" により、
   * Rails session cookie を含めて通信できる。
   */
  const response = await fetch(path, {
    ...restOptions,
    method,
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  const json = await parseJsonOrNull(response);

  /**
   * 2xx 以外の場合は、呼び出し側で扱いやすいように
   * ApiClientError として throw する。
   */
  if (!response.ok) {
    const errorBody = json as Partial<ApiErrorResponse> | null;

    throw new ApiClientError(
      errorBody?.message ?? "API request failed",
      response.status,
      json,
    );
  }

  return json as T;
}
