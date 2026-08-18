import { proxyRequest } from "@/lib/api/proxy-request";

const RESTAURANT_MASTER_AVAILABILITIES_PATH =
  "/api/v1/restaurant_master_availabilities";

// ブラウザから送られてきた検索日時と予約IDを含むクエリパラメータを、そのままRails APIへ転送する。
export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(
    request,
    `${RESTAURANT_MASTER_AVAILABILITIES_PATH}${search}`,
  );
}
