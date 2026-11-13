import { proxyRequest } from "@/lib/api/proxy-request";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id))
    return Response.json(
      { status: "error", message: "担当者IDが不正です", errors: [] },
      { status: 400 },
    );
  return proxyRequest(request, `/api/v1/staff_masters/${id}/password`);
}
