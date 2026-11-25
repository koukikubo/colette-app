import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner, renderWithRole } from "@/test-utils/auth";
import { ApiClientError } from "@/lib/api/api-client";
import { CustomerDetailFields } from "../components/detail/CustomerDetailFields";
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("../api/customer-api", () => ({
  fetchCustomerDetailFields: mocks.read,
  updateCustomerDetailFields: mocks.write,
}));
const data = {
  customer_id: 10,
  lock_version: 2,
  fields: [
    {
      id: 100,
      name: "LINE登録状況",
      group: "連絡",
      mode: "single",
      enabled: true,
      selected_ids: [],
      options: [{ id: 101, label: "登録済み", active: true }],
    },
    {
      id: 200,
      name: "好きなお酒",
      group: "嗜好",
      mode: "multiple",
      enabled: true,
      selected_ids: [201],
      options: [
        { id: 201, label: "日本酒", active: true },
        { id: 202, label: "ワイン", active: true },
      ],
    },
  ],
};
beforeEach(() => {
  mocks.read.mockReset().mockResolvedValue({ data });
  mocks.write.mockReset();
});
it("単一・複数選択を保存し、再取得に失敗しても保存操作を繰り返さない", async () => {
  const user = userEvent.setup();
  const saved = vi.fn().mockRejectedValue(new Error("offline"));
  mocks.write.mockResolvedValue({ data: { ...data, lock_version: 3 } });
  renderWithOwner(
    <CustomerDetailFields
      customerId={10}
      onEditingChange={vi.fn()}
      onSaved={saved}
    />,
  );
  await user.click(
    await screen.findByRole("button", { name: "詳細情報を編集" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "LINE登録状況" }),
    "101",
  );
  await user.click(screen.getByRole("checkbox", { name: "ワイン" }));
  await user.click(screen.getByRole("button", { name: "変更を保存" }));
  await waitFor(() =>
    expect(mocks.write).toHaveBeenCalledWith(10, 2, [
      { field_id: 100, option_ids: [101] },
      { field_id: 200, option_ids: [201, 202] },
    ]),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("保存済み");
  expect(
    screen.queryByRole("button", { name: "変更を保存" }),
  ).not.toBeInTheDocument();
});
it("409でも入力を保持し、検索・分類を変えても回答を消さない", async () => {
  const user = userEvent.setup();
  mocks.write.mockRejectedValue(new ApiClientError("conflict", 409));
  renderWithOwner(
    <CustomerDetailFields
      customerId={10}
      onEditingChange={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await user.click(
    await screen.findByRole("button", { name: "詳細情報を編集" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "LINE登録状況" }),
    "101",
  );
  await user.type(
    screen.getByRole("textbox", { name: "詳細項目を検索" }),
    "好き",
  );
  expect(
    screen.queryByRole("combobox", { name: "LINE登録状況" }),
  ).not.toBeInTheDocument();
  await user.clear(screen.getByRole("textbox", { name: "詳細項目を検索" }));
  expect(screen.getByRole("combobox", { name: "LINE登録状況" })).toHaveValue(
    "101",
  );
  await user.click(screen.getByRole("button", { name: "変更を保存" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("別の担当者");
  expect(screen.getByRole("combobox", { name: "LINE登録状況" })).toHaveValue(
    "101",
  );
});
it("viewerは回答を読めるが編集できない", async () => {
  renderWithRole(
    <CustomerDetailFields
      customerId={10}
      onEditingChange={vi.fn()}
      onSaved={vi.fn()}
    />,
    "viewer",
  );
  expect(await screen.findByText("日本酒")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "詳細情報を編集" }),
  ).not.toBeInTheDocument();
});

it("メモ等で顧客の版が進んだ場合は回答を再取得してから編集する", async () => {
  const user = userEvent.setup();
  const props = {
    customerId: 10,
    customerVersion: 2,
    onEditingChange: vi.fn(),
    onSaved: vi.fn(),
  };
  const view = renderWithOwner(<CustomerDetailFields {...props} />);
  await screen.findByRole("button", { name: "詳細情報を編集" });
  mocks.read.mockResolvedValue({
    data: {
      ...data,
      lock_version: 3,
      fields: data.fields.map((field) =>
        field.id === 100 ? { ...field, selected_ids: [101] } : field,
      ),
    },
  });
  view.rerender(<CustomerDetailFields {...props} customerVersion={3} />);
  await screen.findByText("登録済み");
  await user.click(screen.getByRole("button", { name: "詳細情報を編集" }));
  expect(screen.getByRole("combobox", { name: "LINE登録状況" })).toHaveValue(
    "101",
  );
  mocks.write.mockResolvedValue({ data: { ...data, lock_version: 4 } });
  await user.click(screen.getByRole("button", { name: "変更を保存" }));
  await waitFor(() => expect(mocks.write).toHaveBeenLastCalledWith(10, 3, []));
});

it("編集中に顧客の版が変わっても自分の入力と回答時点を保持する", async () => {
  const user = userEvent.setup();
  const props = {
    customerId: 10,
    customerVersion: 2,
    onEditingChange: vi.fn(),
    onSaved: vi.fn(),
  };
  const view = renderWithOwner(<CustomerDetailFields {...props} />);
  await user.click(
    await screen.findByRole("button", { name: "詳細情報を編集" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "LINE登録状況" }),
    "101",
  );
  view.rerender(<CustomerDetailFields {...props} customerVersion={3} />);
  expect(mocks.read).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("combobox", { name: "LINE登録状況" })).toHaveValue(
    "101",
  );
});

it("409後の最新回答を取得中は再編集できず、回答と版が揃ってから編集する", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  mocks.write.mockRejectedValue(new ApiClientError("conflict", 409));
  renderWithOwner(
    <CustomerDetailFields
      customerId={10}
      onEditingChange={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await user.click(
    await screen.findByRole("button", { name: "詳細情報を編集" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "LINE登録状況" }),
    "101",
  );
  await user.click(screen.getByRole("button", { name: "変更を保存" }));
  await screen.findByRole("alert");
  let finish!: (value: unknown) => void;
  mocks.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(screen.getByRole("button", { name: "最新内容を取得" }));
  expect(screen.getByRole("button", { name: "詳細情報を編集" })).toBeDisabled();
  await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(2));
  finish({
    data: {
      ...data,
      lock_version: 3,
      fields: data.fields.map((field) =>
        field.id === 100 ? { ...field, selected_ids: [101] } : field,
      ),
    },
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "詳細情報を編集" }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "詳細情報を編集" }));
  expect(screen.getByRole("combobox", { name: "LINE登録状況" })).toHaveValue(
    "101",
  );
});
