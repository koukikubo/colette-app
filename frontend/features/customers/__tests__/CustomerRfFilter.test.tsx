import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { CustomerListPageClient } from "../components/list/CustomerListPageClient";

const mocks = vi.hoisted(() => ({ list: vi.fn(), codes: vi.fn() }));
vi.mock("../api/customer-api", () => ({
  fetchCustomerAnalytics: async () => ({
    data: {
      period: {
        month_from: "2026-11-01",
        through: "2026-11-24",
        ranking_from: "2025-11-24",
      },
      summary: {
        customer_count: 0,
        monthly_visits: 0,
        monthly_customers: 0,
        returning_customers: 0,
        returning_ratio: null,
      },
      ranking: [],
      rf_reference: { calculation_run_id: null, base_date: null, ranks: [] },
    },
  }),
  fetchCustomers: mocks.list,
}));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.codes,
}));

beforeEach(() => {
  window.history.replaceState(null, "", "/customers?searched=1");
  mocks.list.mockReset().mockResolvedValue({
    data: {
      customers: [
        {
          id: 10,
          customer_kind: "individual",
          name: "ランク対象",
          kana: "ランクタイショウ",
          phone_number: null,
          hidden: false,
          updated_at: "2026-11-01T00:00:00Z",
          customer_rank: { id: 61, label: "手動A" },
          current_rf_rank: {
            id: 71,
            display_code: "00071",
            label: "履歴A",
            display_color: "#123456",
          },
          rf_rank_state: "ranked",
        },
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: 1,
        total_pages: 2,
      },
      rf_reference: {
        calculation_run_id: 3,
        base_date: "2026-11-01",
        ranks: [
          {
            id: 71,
            display_code: "00071",
            label: "履歴A",
            display_color: "#123456",
          },
        ],
      },
    },
  });
  mocks.codes.mockReset().mockResolvedValue({ data: { standard_masters: [] } });
});

it("手動ランクとRFランクを区別して表示し、条件付きの詳細戻り先を渡す", async () => {
  window.history.replaceState(null, "", "/customers?rf_rank_id=71&page=2");
  renderWithOwner(<CustomerListPageClient />);
  expect(await screen.findByText("手動A")).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "RFランク" }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("rf-rank-color-10")).toHaveStyle({
    backgroundColor: "#123456",
  });
  expect(
    screen.getByRole("link", { name: "ランク対象の詳細を表示" }),
  ).toHaveAttribute(
    "href",
    "/customers/10?return_to=%2Fcustomers%3Frf_rank_id%3D71%26page%3D2",
  );
  await waitFor(() =>
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ rf_rank_id: 71, page: 2 }),
    ),
  );
});

it("RF条件を適用・解除するとページを戻し、他条件を保持する", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/customers?query=浅井&page=2");
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("ランク対象");
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "現在適用中のRFランク" }),
    "71",
  );
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ rf_rank_id: 71, query: "浅井", page: 1 }),
    ),
  );
  await user.click(screen.getByRole("button", { name: /RFランク: 履歴A/ }));
  await waitFor(() =>
    expect(new URLSearchParams(window.location.search).has("rf_rank_id")).toBe(
      false,
    ),
  );
  expect(window.location.search).toContain("query=");
});

it.each([
  ["no_applied_run", "適用履歴なし"],
  ["not_calculated", "未計算"],
  ["excluded", "RF計算対象外"],
  ["no_visit", "来店履歴なし"],
  ["unmatched", "ルール未一致"],
])("%sを固有の状態として表示する", async (state, label) => {
  const response = await mocks.list();
  response.data.customers[0].rf_rank_state = state;
  response.data.customers[0].current_rf_rank = null;
  mocks.list.mockResolvedValue(response);
  renderWithOwner(<CustomerListPageClient />);
  expect(await screen.findByText(label)).toBeInTheDocument();
});

it("分類条件をURLから復元し、ランクIDと混ぜず送信する", async () => {
  window.history.replaceState(
    null,
    "",
    "/customers?rf_rank_state=excluded&page=2",
  );
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("ランク対象");
  expect(mocks.list).toHaveBeenCalledWith(
    expect.objectContaining({
      rf_rank_state: "excluded",
      rf_rank_id: undefined,
      page: 2,
    }),
  );
});

// マスタ由来のランクと内部の計算状態を混ぜず、既存APIの排他条件を維持する。
it("RFランクと計算状態を分離し、選び直すと他方を解除する", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("ランク対象");
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  const rank = screen.getByRole("combobox", { name: "現在適用中のRFランク" });
  const state = screen.getByRole("combobox", { name: "RF計算状態" });
  expect(
    within(rank).queryByRole("option", { name: "未計算" }),
  ).not.toBeInTheDocument();
  expect(
    within(state).queryByRole("option", { name: "履歴A" }),
  ).not.toBeInTheDocument();
  expect(
    within(state).queryByRole("option", { name: "来店履歴なし" }),
  ).not.toBeInTheDocument();
  await user.selectOptions(rank, "71");
  await user.selectOptions(state, "excluded");
  expect(rank).toHaveValue("all");
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rf_rank_state: "excluded",
        rf_rank_id: undefined,
      }),
    ),
  );
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  expect(screen.getByRole("combobox", { name: "RF計算状態" })).toHaveValue(
    "excluded",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "現在適用中のRFランク" }),
    "71",
  );
  expect(screen.getByRole("combobox", { name: "RF計算状態" })).toHaveValue(
    "all",
  );
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ rf_rank_id: 71, rf_rank_state: undefined }),
    ),
  );
});

it("旧未訪問URLを復元でき、リセットで両方のRF条件を解除する", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/customers?rf_rank_state=no_visit");
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("ランク対象");
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  expect(screen.getByRole("combobox", { name: "RF計算状態" })).toHaveValue(
    "no_visit",
  );
  await user.click(screen.getByRole("button", { name: "リセット" }));
  expect(screen.getByRole("combobox", { name: "RF計算状態" })).toHaveValue(
    "all",
  );
  expect(
    screen.getByRole("combobox", { name: "現在適用中のRFランク" }),
  ).toHaveValue("all");
});
