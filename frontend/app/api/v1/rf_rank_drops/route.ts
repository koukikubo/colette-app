import { proxyRequest } from "@/lib/api/proxy-request";

const RF_RANK_DROPS_PATH = "/api/v1/rf_rank_drops";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(request, `${RF_RANK_DROPS_PATH}${search}`);
}
