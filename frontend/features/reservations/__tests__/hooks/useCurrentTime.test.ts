import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCurrentTime } from "../../hooks/useCurrentTime";

describe("useCurrentTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期表示時の現在時刻を返す", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T18:00:00+09:00"));

    const { result } = renderHook(() => useCurrentTime());

    expect(result.current).toEqual(new Date("2026-09-14T18:00:00+09:00"));
  });

  it("1分経過すると現在時刻を更新する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T18:00:00+09:00"));

    const { result } = renderHook(() => useCurrentTime());

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toEqual(new Date("2026-09-14T18:01:00+09:00"));
  });
});
