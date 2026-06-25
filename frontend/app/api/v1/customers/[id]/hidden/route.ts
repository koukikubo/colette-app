import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "../../../route-context";

// 顧客を非表示にする
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/customers/${encodeURIComponent(id)}/hidden`,
  );
}
