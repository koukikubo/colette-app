import { proxyRequest } from "@/lib/api/proxy-request";
import type { RouteContext } from "../../../route-context";

// 監査の閲覧にも既存セッションとRails側の認可を使う。
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyRequest(
    request,
    `/api/v1/reservations/${encodeURIComponent(id)}/result_changes${new URL(request.url).search}`,
  );
}
