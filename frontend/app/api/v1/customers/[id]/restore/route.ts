import { proxyRequest } from "@/lib/api/proxy-request";
import type { CustomerRouteContext } from "../route-context";

// 非表示顧客を復帰する
export async function PATCH(request: Request, context: CustomerRouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/customers/${encodeURIComponent(id)}/restore`,
  );
}
