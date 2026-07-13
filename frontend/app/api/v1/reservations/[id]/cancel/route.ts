import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../../route-context";

// 予約をキャンセルする
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/cancel`,
  );
}
