import { proxyRequest } from "@/lib/api/proxy-request";
import type { RouteContext } from "../../../route-context";

// 予約を対応完了にする。
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/complete`,
  );
}
