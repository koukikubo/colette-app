import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/api/proxy-request";

async function proxyJsonResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return NextResponse.json(data, {
    status: response.status,
  });
}

export async function GET(request: NextRequest) {
  const response = await proxyRequest(
    request,
    `/api/v1/standard_masters/next_code${request.nextUrl.search}`,
  );

  return proxyJsonResponse(response);
}
