import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";
import type { RfRank } from "@/features/rf-management/types/shared";

// このファイルは、RFランク低下APIの入力・出力を定義する。
// RailsのRankDropSummaryと、取得関数・一覧画面の間で使用する。

// 件数セレクターから指定できる値。既存の顧客一覧と統一する。
export type RfRankDropPerPage = 20 | 50 | 100;

// APIへ渡す検索条件。
// 日付はYYYY-MM-DD。未指定ならRails側で当月初日〜今日を使用する。
export type RfRankDropParams = {
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: RfRankDropPerPage;
};

// 共通のランク表示情報に、計算履歴に保存された順位を加える。
export type RfRankDropRank = RfRank & {
  position: number;
};

// 現在適用中の計算結果。画面でデータの基準日を表示するために使う。
export type RfRankDropRun = {
  id: number;
  base_date: string;
  rule_set_id: number;
};

// 現在の記録が通常ランクか、特殊区分かを区別する。
export type RfRankDropLatestState =
  "ranked" | "missing" | "excluded" | "unmatched" | "no_visit";

// 期間内に低下した顧客1人分。
// 低下前・低下時・現在を分け、回復した顧客も正しく表示できるようにする。
export type RfRankDropCustomer = {
  customer_id: number;
  customer_name: string;
  detected_on: string;
  calculation_run_id: number;
  comparison_run_id: number;
  previous_rank: RfRankDropRank;
  dropped_rank: RfRankDropRank;
  latest_state: RfRankDropLatestState;
  latest_rank: RfRankDropRank | null;
  last_visit_on: string | null;
};

// 一部の履歴を比較できなかった場合の情報。
// 画面に注意を表示し、「全履歴を比較できた」と誤解させないために使う。
export type RfRankDropSkippedComparison = {
  run_id: number;
  base_date: string;
  reason: "no_previous_run" | "rule_set_changed" | "base_date_reversed";
};

// 比較できない理由。対象者が0人だった状態とは区別する。
export type RfRankDropUnavailableState =
  | "no_current_run"
  | "no_history_in_period"
  | "no_previous_run"
  | "no_comparable_history";

// 比較の成否にかかわらず返される情報。
type RfRankDropCommonData = {
  start_date: string;
  end_date: string;
  skipped_comparisons: RfRankDropSkippedComparison[];
};

// 比較に成功したレスポンス。
// 対象者0人の場合もreadyで、件数は数値として返る。
export type RfRankDropReadyData = RfRankDropCommonData & {
  state: "ready";
  current_run: RfRankDropRun;
  pagination: Pagination;
  customers: RfRankDropCustomer[];
};

// 比較できなかったレスポンス。
// 件数は0ではなくnull。画面で通常のページ操作を出さない。
export type RfRankDropUnavailableData = RfRankDropCommonData & {
  state: RfRankDropUnavailableState;
  current_run: RfRankDropRun | null;
  pagination: Omit<Pagination, "total_count" | "total_pages"> & {
    total_count: null;
    total_pages: null;
  };
  customers: RfRankDropCustomer[];
};

// stateを確認すると、TypeScriptも比較成功・比較不能の型を区別できる。
export type RfRankDropData = RfRankDropReadyData | RfRankDropUnavailableData;

// Rails共通の成功レスポンス形式でdataを包む。
export type RfRankDropResponse = ApiSuccessResponse<RfRankDropData>;
