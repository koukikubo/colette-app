import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../route-context";

const RESTAURANT_MASTERS_API_PATH = "/api/v1/restaurant_masters";

// 顧客詳細を取得する
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `${RESTAURANT_MASTERS_API_PATH}/${encodeURIComponent(id)}`,
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `${RESTAURANT_MASTERS_API_PATH}/${encodeURIComponent(id)}`,
  );
}
