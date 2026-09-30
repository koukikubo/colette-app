import type { RouteContext } from "@/app/api/v1/route-context";
import { proxyRequest } from "@/lib/api/proxy-request";

async function forwardRuleSetRequest(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/rf_rule_sets/${encodeURIComponent(id)}`,
  );
}

export async function GET(request: Request, context: RouteContext) {
  return forwardRuleSetRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return forwardRuleSetRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return forwardRuleSetRequest(request, context);
}
