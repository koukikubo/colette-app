import { proxyRequest } from "@/lib/api/proxy-request";
export function GET(request: Request) {
  return proxyRequest(
    request,
    `/api/v1/rf_rank_drop_predictions${new URL(request.url).search}`,
  );
}
