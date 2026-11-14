import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReadRefresh } from "../useReadRefresh";
import { useUrlQuery } from "../useUrlQuery";
afterEach(() => vi.useRealTimers());
it("表示中だけ再取得し、編集中や確認ダイアログ中は自動再取得しない", () => {
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const refresh = vi.fn();
  const { rerender } = renderHook(
    ({ enabled }) => useReadRefresh(refresh, enabled),
    { initialProps: { enabled: true } },
  );
  act(() => vi.advanceTimersByTime(30_000));
  expect(refresh).toHaveBeenCalledTimes(1);
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  document.body.append(dialog);
  act(() => vi.advanceTimersByTime(30_000));
  expect(refresh).toHaveBeenCalledTimes(1);
  dialog.remove();
  rerender({ enabled: false });
  act(() => vi.advanceTimersByTime(30_000));
  expect(refresh).toHaveBeenCalledTimes(1);
});
it("URLの検索条件を初期表示に復元し、変更と戻る操作を通知する", () => {
  window.history.replaceState(null, "", "/customers?query=test&page=2");
  const { result } = renderHook(() => useUrlQuery());
  expect(result.current.params.get("query")).toBe("test");
  act(() => result.current.update({ page: 3 }));
  expect(window.location.search).toContain("page=3");
  act(() => {
    window.history.replaceState(null, "", "/customers?query=previous&page=1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(result.current.params.get("query")).toBe("previous");
});
