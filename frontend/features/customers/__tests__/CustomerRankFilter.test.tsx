import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { CustomerListPageClient } from "../components/list/CustomerListPageClient";
const mocks = vi.hoisted(() => ({ list: vi.fn(), codes: vi.fn() }));
vi.mock("../api/customer-api", () => ({ fetchCustomers: mocks.list }));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.codes,
}));
beforeEach(() => {
  mocks.list
    .mockReset()
    .mockResolvedValue({
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_count: 0,
          total_pages: 0,
        },
      },
    });
  mocks.codes.mockReset().mockResolvedValue({
    data: {
      standard_masters: [
        {
          system_key: "customer_rank",
          items: [
            { id: 61, label: "Aランク", active: true },
            { id: 66, label: "旧ランク", active: false },
          ],
        },
      ],
    },
  });
});
it("URLの手動ランクを復元し、適用と解除でページを1へ戻す", async () => {
  window.history.replaceState(
    null,
    "",
    "/customers?customer_rank_id=61&page=3&query=浅井",
  );
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("検索条件に一致する顧客が見つかりません");
  await waitFor(() =>
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ customer_rank_id: 61, page: 3, query: "浅井" }),
    ),
  );
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  const select = await screen.findByRole("combobox", {
    name: "手動設定の顧客ランク",
  });
  expect(select).toHaveValue("61");
  await user.selectOptions(select, "66");
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ customer_rank_id: 66, page: 1, query: "浅井" }),
    ),
  );
  expect(window.location.search).toContain("customer_rank_id=66");
  await user.click(
    await screen.findByRole("button", { name: /手動ランク: 旧ランク/ }),
  );
  await waitFor(() =>
    expect(
      new URLSearchParams(window.location.search).has("customer_rank_id"),
    ).toBe(false),
  );
  expect(mocks.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1, query: "浅井" }),
  );
});
it("未設定で絞り込み、全解除では検索語とランクの両方を消す", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("顧客が登録されていません");
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  await user.selectOptions(
    await screen.findByRole("combobox", { name: "手動設定の顧客ランク" }),
    "unassigned",
  );
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ customer_rank_id: "unassigned", page: 1 }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "すべて解除" }));
  await waitFor(() =>
    expect(
      new URLSearchParams(window.location.search).has("customer_rank_id"),
    ).toBe(false),
  );
});
