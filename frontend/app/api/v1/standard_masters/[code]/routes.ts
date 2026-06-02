import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

async function proxyJsonResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return NextResponse.json(data, {
    status: response.status,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  const response = await proxyRequest(
    request,
    `/api/v1/standard_masters/${code}`,
  );

  return proxyJsonResponse(response);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  const response = await proxyRequest(
    request,
    `/api/v1/standard_masters/${code}`,
  );

  return proxyJsonResponse(response);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  const response = await proxyRequest(
    request,
    `/api/v1/standard_masters/${code}`,
  );

  return proxyJsonResponse(response);
}
