import type { RouteContext } from "@/app/api/v1/route-context";
import { proxyRequest } from "@/lib/api/proxy-request";

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { search } = new URL(request.url);

  return proxyRequest(
    request,
    `/api/v1/rf_calculation_runs/${encodeURIComponent(id)}/results${search}`,
  );
}
