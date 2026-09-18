import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../../route-context";

// 顧客に紐づく予約履歴を取得する。
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { search } = new URL(request.url);

  return proxyRequest(
    request,
    `/api/v1/customers/${encodeURIComponent(id)}/reservations${search}`,
  );
}
