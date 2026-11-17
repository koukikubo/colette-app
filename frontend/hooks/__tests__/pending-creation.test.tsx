import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { usePendingCreation } from "../usePendingCreation";
import { ApiClientError } from "@/lib/api/api-client";
const lookup = vi.fn();
const create = vi.fn();
const scope = "colette:creation:v1:1:customers";
function Form() {
  const recovery = usePendingCreation("customers", lookup);
  const [name, setName] = useState("顧客の個人情報");
  const [error, setError] = useState("");
  async function submit() {
    try {
      const payload = { name };
      const key = recovery.begin(payload);
      await create(payload, key);
      recovery.complete();
    } catch (failure) {
      recovery.failed(failure);
      setError("登録結果を確認");
    }
  }
  return (
    <>
      <input
        aria-label="顧客名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button disabled={!recovery.ready} onClick={() => void submit()}>
        登録
      </button>
      <button onClick={() => void recovery.check()}>再確認</button>
      <output>
        {recovery.found ? "登録済み" : recovery.missing ? "未確認" : "初期"}
      </output>
      <p>
        {error}
        {recovery.error}
      </p>
    </>
  );
}
beforeEach(() => {
  lookup.mockReset();
  create.mockReset();
  sessionStorage.clear();
});
it("応答消失後の再マウントでも同じキーでGETし、POSTを自動再送しない", async () => {
  create.mockRejectedValueOnce(new TypeError("connection lost"));
  const first = render(<Form />);
  await userEvent.click(await screen.findByRole("button", { name: "登録" }));
  await screen.findByText("登録結果を確認");
  const key = sessionStorage.getItem(scope);
  expect(key).toMatch(/^[a-f0-9-]{36}$/);
  expect(key).not.toContain("顧客");
  first.unmount();
  lookup.mockResolvedValue({ data: { customer: { id: 3 } } });
  render(<Form />);
  await screen.findByText("登録済み");
  expect(lookup).toHaveBeenCalledWith(key);
  expect(create).toHaveBeenCalledTimes(1);
});
it("404でもキーを保持し、元の入力で再送したときだけ同じキーを使う", async () => {
  const key = "pending-creation-key-1234";
  sessionStorage.setItem(scope, key);
  lookup.mockRejectedValue(
    new ApiClientError("not found", 404, [], "creation_not_found"),
  );
  create.mockResolvedValue({});
  render(<Form />);
  await screen.findByText("未確認");
  expect(sessionStorage.getItem(scope)).toBe(key);
  await userEvent.click(screen.getByRole("button", { name: "登録" }));
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith({ name: "顧客の個人情報" }, key),
  );
  expect(sessionStorage.getItem(scope)).toBeNull();
});
it("結果不明の入力変更では別のPOSTを送らない", async () => {
  create.mockRejectedValue(new TypeError("lost"));
  render(<Form />);
  await userEvent.click(screen.getByRole("button", { name: "登録" }));
  await screen.findByText("登録結果を確認");
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox"), "変更");
  await user.click(screen.getByRole("button", { name: "登録" }));
  expect(create).toHaveBeenCalledTimes(1);
});
it("キーの保存に失敗したらPOSTを送らない", async () => {
  render(<Form />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "登録" })).toBeEnabled(),
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("denied");
  });
  await userEvent.click(screen.getByRole("button", { name: "登録" }));
  expect(create).not.toHaveBeenCalled();
});
it("結果不明の再送で項目エラーを確認したら同じキーのまま入力を修正できる", async () => {
  create
    .mockRejectedValueOnce(new TypeError("lost"))
    .mockRejectedValueOnce(
      new ApiClientError("入力エラー", 422, { name: ["確認してください"] }),
    )
    .mockResolvedValueOnce({});
  lookup.mockRejectedValue(
    new ApiClientError("not found", 404, [], "creation_not_found"),
  );
  const user = userEvent.setup();
  render(<Form />);
  await user.click(screen.getByRole("button", { name: "登録" }));
  await screen.findByText("未確認");
  const key = sessionStorage.getItem(scope);
  await user.click(screen.getByRole("button", { name: "登録" }));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  await screen.findByText("未確認");
  await user.clear(screen.getByRole("textbox"));
  await user.type(screen.getByRole("textbox"), "修正済み");
  await user.click(screen.getByRole("button", { name: "登録" }));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(3));
  expect(create.mock.calls[2]).toEqual([{ name: "修正済み" }, key]);
});
it("認証元や形式が不明な4xxでも送信キーを捨てない", async () => {
  create.mockRejectedValue(
    new ApiClientError("HTML", 422, [], "unexpected_response"),
  );
  lookup.mockRejectedValue(
    new ApiClientError("not found", 404, [], "creation_not_found"),
  );
  render(<Form />);
  await userEvent.click(screen.getByRole("button", { name: "登録" }));
  await screen.findByText("未確認");
  expect(sessionStorage.getItem(scope)).toMatch(/^[a-f0-9-]{36}$/);
  expect(create).toHaveBeenCalledTimes(1);
});
