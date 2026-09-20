import { proxyRequest } from "@/lib/api/proxy-request";
import type { RouteContext } from "../../../route-context";

// 予約の対応完了を取り消す。
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/reopen`,
  );
}
