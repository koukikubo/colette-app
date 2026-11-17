import { apiFetch } from "@/lib/api/api-client";

import type {
  RfRankDropParams,
  RfRankDropResponse,
} from "../types/rf-rank-drop";

// RFランク低下APIのURL生成と取得処理を担当する。
// 画面・Hookから呼び、Next.jsのroute.tsを経由してRailsへ接続する。
const RF_RANK_DROPS_PATH = "/api/v1/rf_rank_drops";

// 指定された期間・ページ・表示件数を、URLのクエリ文字列へ変換する。
// 未指定の条件は送らず、Rails側の初期値を使用する。
function buildRfRankDropsPath(params: RfRankDropParams) {
  const searchParams = new URLSearchParams();

  if (params.start_date !== undefined) {
    searchParams.set("start_date", params.start_date);
  }

  if (params.end_date !== undefined) {
    searchParams.set("end_date", params.end_date);
  }

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page !== undefined) {
    searchParams.set("per_page", String(params.per_page));
  }

  const queryString = searchParams.toString();

  return queryString
    ? `${RF_RANK_DROPS_PATH}?${queryString}`
    : RF_RANK_DROPS_PATH;
}

// RFランク低下一覧を取得する。
// Cookieの送信とHTTPエラーの例外化は、顧客一覧と同じapiFetchへ任せる。
// signalは、条件変更時に古いリクエストを中止するためにHookから受け取る。
export function fetchRfRankDrops(
  params: RfRankDropParams = {},
  signal?: AbortSignal,
): Promise<RfRankDropResponse> {
  return apiFetch<RfRankDropResponse>(buildRfRankDropsPath(params), {
    cache: "no-store",
    signal,
  });
}
