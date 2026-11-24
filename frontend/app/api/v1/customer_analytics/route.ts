import { proxyRequest } from "@/lib/api/proxy-request";

// 集計も既存のCookie Session・CSRF・同一オリジンの経路を維持する。
export async function GET(request: Request) {
  return proxyRequest(request, "/api/v1/customer_analytics");
}
