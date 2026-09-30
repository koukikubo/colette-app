import { apiFetch } from "@/lib/api/api-client";

import type {
  RfCalculationRunListResponse,
  RfCalculationRunResponse,
  RfCustomerRankResultListResponse,
  RfListParams,
  RfRuleSetListResponse,
  RfRuleSetResponse,
  RfSettingsResponse,
} from "../types";

const RF_SETTINGS_PATH = "/api/v1/rf_settings";
const RF_RULE_SETS_PATH = "/api/v1/rf_rule_sets";
const RF_CALCULATION_RUNS_PATH = "/api/v1/rf_calculation_runs";

// page・per_pageを一覧APIのクエリ文字列へ変換する。
function buildPaginatedPath(path: string, params: RfListParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page !== undefined) {
    searchParams.set("per_page", String(params.per_page));
  }

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

// 現在公開中のRFルールと適用中の計算結果を取得する。
export function fetchRfSettings(signal?: AbortSignal) {
  return apiFetch<RfSettingsResponse>(RF_SETTINGS_PATH, {
    cache: "no-store",
    signal,
  });
}

// RFルールセット一覧を取得する。
export function fetchRfRuleSets(
  params: RfListParams = {},
  signal?: AbortSignal,
) {
  return apiFetch<RfRuleSetListResponse>(
    buildPaginatedPath(RF_RULE_SETS_PATH, params),
    {
      cache: "no-store",
      signal,
    },
  );
}

// 指定したRFルールセットの条件とランク対応表を取得する。
export function fetchRfRuleSet(id: number, signal?: AbortSignal) {
  return apiFetch<RfRuleSetResponse>(
    `${RF_RULE_SETS_PATH}/${encodeURIComponent(String(id))}`,
    {
      cache: "no-store",
      signal,
    },
  );
}

// RF計算履歴一覧を取得する。
export function fetchRfCalculationRuns(
  params: RfListParams = {},
  signal?: AbortSignal,
) {
  return apiFetch<RfCalculationRunListResponse>(
    buildPaginatedPath(RF_CALCULATION_RUNS_PATH, params),
    {
      cache: "no-store",
      signal,
    },
  );
}

// 指定したRF計算履歴の詳細を取得する。
export function fetchRfCalculationRun(id: number, signal?: AbortSignal) {
  return apiFetch<RfCalculationRunResponse>(
    `${RF_CALCULATION_RUNS_PATH}/${encodeURIComponent(String(id))}`,
    {
      cache: "no-store",
      signal,
    },
  );
}

// 指定したRF計算履歴に含まれる顧客別結果を取得する。
export function fetchRfCalculationResults(
  id: number,
  params: RfListParams = {},
  signal?: AbortSignal,
) {
  const path =
    `${RF_CALCULATION_RUNS_PATH}/` +
    `${encodeURIComponent(String(id))}/results`;

  return apiFetch<RfCustomerRankResultListResponse>(
    buildPaginatedPath(path, params),
    {
      cache: "no-store",
      signal,
    },
  );
}
