import { proxyRequest } from "@/lib/api/proxy-request";

const RESTAURANT_MASTERS_API_PATH = "/api/v1/restaurant_masters";
// 予約テーブル一覧を取得する
export async function GET(request: Request) {
  return proxyRequest(request, RESTAURANT_MASTERS_API_PATH);
}

// 予約テーブルを登録する
export async function POST(request: Request) {
  return proxyRequest(request, RESTAURANT_MASTERS_API_PATH);
}
