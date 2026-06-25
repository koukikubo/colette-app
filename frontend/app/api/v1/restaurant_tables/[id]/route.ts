import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../route-context";

const RESTAURANT_TABLES_API_PATH = "/api/v1/restaurant_tables";

// 顧客詳細を取得する
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `${RESTAURANT_TABLES_API_PATH}/${encodeURIComponent(id)}`,
  );
}

// 顧客情報を更新する
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `${RESTAURANT_TABLES_API_PATH}/${encodeURIComponent(id)}`,
  );
}
