import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: {
    code: string;
  };
};

// 基本コードの有効化
export async function PATCH(request: Request, { params }: RouteContext) {
  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(params.code)}/enable`,
  );
}
