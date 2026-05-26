import { proxyRequest } from "@/lib/api/proxy-request";
// APIのヘルスチェックエンドポイント
export async function DELETE(request: Request) {
  return proxyRequest(request, "/api/v1/staff/logout");
}
