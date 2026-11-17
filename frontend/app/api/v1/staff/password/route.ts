import { proxyRequest } from "@/lib/api/proxy-request";
export function PATCH(request: Request) {
  return proxyRequest(request, "/api/v1/staff/password");
}
