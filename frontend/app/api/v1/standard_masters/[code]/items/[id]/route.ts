import { type NextRequest } from "next/server";

import { proxyRequest } from "@/lib/api/proxy-request";

type RouteContext = {
  params: Promise<{
    code: string;
    id: string;
  }>;
};

/**
 * 選択肢コード詳細取得。
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { code, id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(
      code,
    )}/items/${encodeURIComponent(id)}`,
  );
}

/**
 * 選択肢コード更新。
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { code, id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(
      code,
    )}/items/${encodeURIComponent(id)}`,
  );
}

/**
 * 選択肢コード削除。
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { code, id } = await context.params;

  return proxyRequest(
    request,
    `/api/v1/standard_masters/${encodeURIComponent(
      code,
    )}/items/${encodeURIComponent(id)}`,
  );
}
