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
  // GETやHEADリクエストの場合はボディを送信しない
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  // Rails APIにリクエストを転送
  const upstream = await fetch(`${RAILS_API_URL}${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });
  // レスポンスのボディとヘッダーを準備
  const responseBody = await upstream.text();
  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "application/json",
  );
  // Rails APIからのSet-Cookieヘッダーを転送
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders.set("Set-Cookie", setCookie);
  }
  // クライアントにレスポンスを返す
  return new Response(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
