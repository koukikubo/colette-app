import { proxyRequest } from "@/lib/api/proxy-request";

const RF_RULE_SETS_PATH = "/api/v1/rf_rule_sets";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(request, `${RF_RULE_SETS_PATH}${search}`);
}

export async function POST(request: Request) {
  return proxyRequest(request, RF_RULE_SETS_PATH);
}
