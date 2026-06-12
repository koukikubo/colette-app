import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    id: number;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(id)}/items${
      request.nextUrl.search
    }`,
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(id)}/items`,
  );
}
