import { proxyRequest } from "@/lib/api/proxy-request";

const RF_CALCULATION_RUNS_PATH = "/api/v1/rf_calculation_runs";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyRequest(request, `${RF_CALCULATION_RUNS_PATH}${search}`);
}
