import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../../route-context";

// キャンセル済み予約を復元する
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/restore`,
  );
}
