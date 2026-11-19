import { proxyRequest } from "@/lib/api/proxy-request";
import type { RouteContext } from "../../../route-context";

// セッション・CSRF・再送キーを共通proxyでRailsへ引き継ぐ。
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/correct_result`,
  );
}
