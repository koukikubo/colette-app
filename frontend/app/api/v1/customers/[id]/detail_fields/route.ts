import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../../route-context";

// 認証・CSRF・エラー形式は既存のNext→Rails境界を維持する。
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyRequest(
    request,
    `/api/v1/customers/${encodeURIComponent(id)}/detail_fields`,
  );
}
export const PATCH = GET;
