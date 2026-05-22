import { proxyRequest } from "@/lib/api/proxy-request";
// APIのヘルスチェックエンドポイント
export async function GET(request: Request) {
  return proxyRequest(request, "/api/v1/health");
  }
