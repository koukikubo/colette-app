import { proxyRequest } from "@/lib/api/proxy-request";
import { RouteContext } from "@/app/api/v1/route-context";

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(id)}`,
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(id)}`,
  );
}
