import { proxyRequest } from "@/lib/api/proxy-request";

const RF_SETTINGS_PATH = "/api/v1/rf_settings";

export async function GET(request: Request) {
  return proxyRequest(request, RF_SETTINGS_PATH);
}
