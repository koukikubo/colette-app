import { proxyRequest } from "@/lib/api/proxy-request";
export function GET(request: Request) {
  return proxyRequest(request, "/api/v1/staff/guide_state");
}
export function PATCH(request: Request) {
  return proxyRequest(request, "/api/v1/staff/guide_state");
}
