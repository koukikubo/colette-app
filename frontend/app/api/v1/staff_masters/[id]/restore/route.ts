import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/staff_masters/${encodeURIComponent(id)}/restore`,
  );
}
