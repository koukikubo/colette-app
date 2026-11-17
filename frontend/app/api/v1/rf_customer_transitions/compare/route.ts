import { proxyRequest } from "@/lib/api/proxy-request";

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ["start_month", "end_month"]) {
    const value = incoming.get(key);
    if (value !== null) params.set(key, value);
  }
  return proxyRequest(
    request,
    `/api/v1/rf_customer_transitions/compare?${params}`,
  );
}
