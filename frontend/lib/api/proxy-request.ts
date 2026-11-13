const RAILS_API_URL = process.env.RAILS_API_URL;
// 通信の共通基盤
export async function proxyRequest(
  request: Request,
  path: string,
): Promise<Response> {
  // RAILS_API_URLが定義されていない場合はエラーをスロー
  if (!RAILS_API_URL) {
    throw new Error("RAILS_API_URL is not defined");
  }

  // リクエストのメソッド、CSRFトークン、ヘッダーを準備
  const method = request.method;
  const csrfToken = request.headers.get("X-CSRF-Token");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  // クッキーを転送
  const cookies = request.headers.get("Cookie");
  if (cookies) {
    headers["Cookie"] = cookies;
  }
  // CSRFトークンが存在する場合はヘッダーに追加
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  // GETやHEADリクエストの場合はボディを送信しない
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  // Rails APIにリクエストを転送
  let upstream: Response;
  try {
    upstream = await fetch(`${RAILS_API_URL}${path}`, {
      method,
      headers,
      body,
      cache: "no-store",
      // 上流の応答待ちで画面が止まり続けないようにする。
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // 内部URLや例外本文を公開せず、共通API形式で再試行を案内する。
    return Response.json(
      {
        status: "error",
        message:
          "サーバーに接続できませんでした。しばらくしてから再試行してください。",
        errors: [],
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
  // レスポンスのボディとヘッダーを準備
  const responseBody = await upstream.text();
  const responseHeaders = new Headers();
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "application/json",
  );
  // Rails APIからのSet-Cookieヘッダーを転送
  for (const setCookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("Set-Cookie", setCookie);
  }
  // 204・205・304は本文を持たないレスポンスとして返す。
  const hasNoBody = [204, 205, 304].includes(upstream.status);

  return new Response(hasNoBody ? null : responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
