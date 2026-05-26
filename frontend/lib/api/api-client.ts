// 型を定義
export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

export type ApiErrorResponse = {
  status: "error";
  message: string;
  errors?: string[];
};

export class ApiClientError extends Error {
  status: number;
  errors: string[];

  constructor({
    message,
    status,
    errors = [],
  }: {
    message: string;
    status: number;
    errors?: string[];
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

// APIリクエストを行う関数
async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  // 空のレスポンスはJSONとしてパースできないため、nullを返す
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

// APIリクエストを行う関数
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  // Acceptヘッダーが指定されていない場合は、デフォルトでapplication/jsonを設定
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  //  Content-Typeヘッダーが指定されていない場合で、bodyが存在する場合は、デフォルトでapplication/jsonを設定
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // APIリクエストを送信
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  // レスポンスをJSONとしてパース
  const body = await parseJson(response);

  // レスポンスがエラーの場合は、ApiClientErrorをスロー
  if (!response.ok) {
    const errorBody = body as Partial<ApiErrorResponse> | null;

    throw new ApiClientError({
      message: errorBody?.message ?? "API request failed",
      status: response.status,
      errors: errorBody?.errors ?? [],
    });
  }
  // レスポンスが成功の場合は、データを返す
  const successBody = body as ApiSuccessResponse<T>;
  // 成功レスポンスの形式が正しいかをチェック
  return successBody.data;
}

// CSRFトークンを取得する関数
export async function getCsrfToken(): Promise<string> {
  const data = await apiRequest<{ csrf_token: string }>("/api/v1/csrf");

  return data.csrf_token;
}

// CSRFトークンを含むAPIリクエストを行う関数
export async function csrfRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // CSRFトークンを取得
  const csrfToken = await getCsrfToken();

  // CSRFトークンをリクエストヘッダーに追加
  const headers = new Headers(options.headers);
  headers.set("X-CSRF-Token", csrfToken);

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
}
