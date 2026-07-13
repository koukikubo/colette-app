import { proxyRequest } from "@/lib/api/proxy-request";

const RESERVATIONS_PATH = "/api/v1/reservations";

// 予約一覧を取得する
export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(request, `${RESERVATIONS_PATH}${search}`);
}

// 予約を登録する
export async function POST(request: Request) {
  return proxyRequest(request, RESERVATIONS_PATH);
}
