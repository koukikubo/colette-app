import { proxyRequest } from "@/lib/api/proxy-request";
export function GET(request: Request) {
  // 選択月を落とすとRailsが当月へ戻すため、検索条件も同じ経路で渡す。
  return proxyRequest(
    request,
    `/api/v1/reservation_calendar${new URL(request.url).search}`,
  );
}
