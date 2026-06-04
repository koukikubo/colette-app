import { type NextRequest } from "next/server";

import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(code)}/items${
      request.nextUrl.search
    }`,
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(code)}/items`,
  );
}
