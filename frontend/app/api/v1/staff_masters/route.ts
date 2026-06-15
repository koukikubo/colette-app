import { proxyRequest } from "@/lib/api/proxy-request";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/v1/staff_masters");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/v1/staff_masters");
}
