import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

/**
 * 選択肢コード詳細取得。
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id, itemId } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(
      id,
    )}/items/${encodeURIComponent(itemId)}`,
  );
}

/**
 * 選択肢コード更新。
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, itemId } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(
      id,
    )}/items/${encodeURIComponent(itemId)}`,
  );
}
