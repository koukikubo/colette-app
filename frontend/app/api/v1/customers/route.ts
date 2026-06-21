import { proxyRequest } from "@/lib/api/proxy-request";

const CUSTOMERS_PATH = "/api/v1/customers";

// 顧客一覧を取得する
export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(request, `${CUSTOMERS_PATH}${search}`);
}

// 顧客を登録する
export async function POST(request: Request) {
  return proxyRequest(request, CUSTOMERS_PATH);
}
