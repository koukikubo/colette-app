import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api/api-client";

import {
  fetchRfCalculationRun,
  fetchRfCalculationResults,
  fetchRfCalculationRuns,
  fetchRfRuleSet,
  fetchRfRuleSets,
  fetchRfSettings,
} from "../../api/rf-management-api";

vi.mock("@/lib/api/api-client", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

describe("RF管理API", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("現在のRF設定を取得する", () => {
    fetchRfSettings();

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/rf_settings", {
      cache: "no-store",
      signal: undefined,
    });
  });

  it("RFルールセット一覧をページ指定付きで取得する", () => {
    fetchRfRuleSets({
      page: 2,
      per_page: 20,
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_rule_sets?page=2&per_page=20",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });

  it("RFルールセット詳細を取得する", () => {
    fetchRfRuleSet(10);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/rf_rule_sets/10", {
      cache: "no-store",
      signal: undefined,
    });
  });

  it("RF計算履歴一覧をページ指定付きで取得する", () => {
    fetchRfCalculationRuns({
      page: 1,
      per_page: 10,
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_calculation_runs?page=1&per_page=10",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });

  it("RF計算履歴詳細を取得する", () => {
    fetchRfCalculationRun(20);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_calculation_runs/20",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });

  it("顧客別RF計算結果をページ指定付きで取得する", () => {
    fetchRfCalculationResults(20, {
      page: 3,
      per_page: 50,
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_calculation_runs/20/results?page=3&per_page=50",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });
});
