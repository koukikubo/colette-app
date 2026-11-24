import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CustomerKeywordSearch } from "../components/search/CustomerKeywordSearch";

it("日本語入力の変換確定Enterでは検索せず、確定後のEnterで検索する", () => {
  const onSearch = vi.fn();
  render(
    <CustomerKeywordSearch
      value="浅井"
      onValueChange={vi.fn()}
      onSearch={onSearch}
    />,
  );
  const input = screen.getByRole("searchbox", { name: "顧客検索キーワード" });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true, keyCode: 229 });
  expect(onSearch).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter", isComposing: false, keyCode: 13 });
  expect(onSearch).toHaveBeenCalledTimes(1);
});
