import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import type {
  RfRankDropPerPage,
  RfRankDropRank,
  RfRankDropRun,
} from "./rf-rank-drop";

// 低下済み一覧と同じ件数選択肢を使用する。
// 既存の型を再利用し、20・50・100の定義を重複させない。
export type RfRankDropPredictionParams = {
  until_date?: string;
  page?: number;
  per_page?: RfRankDropPerPage;
};

// 予測一覧に固有の顧客情報。
// 低下済みのdetected_onとは異なり、将来の予定日と残り日数を持つ。
export type RfRankDropPredictionCustomer = {
  customer_id: number;
  customer_name: string;
  predicted_drop_on: string;
  days_until_drop: number;

  // 予測基準日の履歴から再計算したランク。
  // 保存済みの最新ランクとは区別する。
  current_rank: RfRankDropRank;
  predicted_rank: RfRankDropRank;
};

// 日付はRailsから返されるYYYY-MM-DD形式。
// base_dateは予測の基準日、until_dateは探索期限。
type RfRankDropPredictionCommonData = {
  base_date: string;
  until_date: string;
};

// 計算できた結果。対象者0人でもready。
// current_runは、使用ルールの選択元となった適用履歴。
export type RfRankDropPredictionReadyData = RfRankDropPredictionCommonData & {
  state: "ready";
  current_run: RfRankDropRun;
  pagination: Pagination;
  customers: RfRankDropPredictionCustomer[];
};

// 適用履歴がなく、予測できない状態。
// 件数をnullにして、計算結果が0人の場合と区別する。
export type RfRankDropPredictionUnavailableData =
  RfRankDropPredictionCommonData & {
    state: "no_current_run";
    current_run: null;
    pagination: Omit<Pagination, "total_count" | "total_pages"> & {
      total_count: null;
      total_pages: null;
    };
    customers: RfRankDropPredictionCustomer[];
  };

export type RfRankDropPredictionData =
  RfRankDropPredictionReadyData | RfRankDropPredictionUnavailableData;

// 成功レスポンスの外側も、既存の共通型を使用する。
export type RfRankDropPredictionResponse =
  ApiSuccessResponse<RfRankDropPredictionData>;
