import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../route-context";

// 予約詳細を取得する
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}`,
  );
}

// 予約を更新する
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}`,
  );
}
