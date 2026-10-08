import type { RouteContext } from "@/app/api/v1/route-context";
import { proxyRequest } from "@/lib/api/proxy-request";

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/rf_calculation_runs/${encodeURIComponent(id)}/restore`,
  );
}
