import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../route-context";

// 顧客詳細を取得する
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(request, `/api/v1/customers/${encodeURIComponent(id)}`);
}

// 顧客情報を更新する
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(request, `/api/v1/customers/${encodeURIComponent(id)}`);
}
