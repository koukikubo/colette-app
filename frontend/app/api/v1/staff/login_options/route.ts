import { proxyRequest } from "@/lib/api/proxy-request";

// ログイン画面で使用する担当者候補をRails APIから取得する
export async function GET(request: Request) {
  return proxyRequest(request, "/api/v1/staff/login_options");
}
