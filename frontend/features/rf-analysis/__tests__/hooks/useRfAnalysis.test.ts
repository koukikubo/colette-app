import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useRfAnalysis } from "../../hooks/useRfAnalysis";
import { rfAnalysisFixture } from "../fixtures";

const mocks = vi.hoisted(() => ({
  fetchRfAnalysis: vi.fn(),
}));

vi.mock("../../api/rf-analysis-api", () => ({
  fetchRfAnalysis: mocks.fetchRfAnalysis,
}));

describe("useRfAnalysis", () => {
  beforeEach(() => {
    mocks.fetchRfAnalysis.mockReset();
  });

  it("RF分析結果を取得する", async () => {
    mocks.fetchRfAnalysis.mockResolvedValue({
      data: {
        analysis: rfAnalysisFixture,
      },
    });

    const { result } = renderHook(() => useRfAnalysis());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfAnalysis).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(result.current.analysis).toEqual(rfAnalysisFixture);
    expect(result.current.errorMessage).toBeNull();
  });

  it("適用中の計算結果がない場合はnullを返す", async () => {
    mocks.fetchRfAnalysis.mockResolvedValue({
      data: {
        analysis: null,
      },
    });

    const { result } = renderHook(() => useRfAnalysis());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("APIエラーのメッセージを返す", async () => {
    mocks.fetchRfAnalysis.mockRejectedValue(
      new ApiClientError("RF分析結果を取得する権限がありません。", 403),
    );

    const { result } = renderHook(() => useRfAnalysis());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.errorMessage).toBe(
      "RF分析結果を取得する権限がありません。",
    );
  });

  it("予期しないエラーでは共通メッセージを返す", async () => {
    mocks.fetchRfAnalysis.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useRfAnalysis());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.errorMessage).toBe(
      "RF分析結果を取得できませんでした。",
    );
  });

  it("再取得キーが変わるとRF分析結果を再取得する", async () => {
    mocks.fetchRfAnalysis.mockResolvedValue({
      data: {
        analysis: rfAnalysisFixture,
      },
    });

    const { rerender } = renderHook(
      ({ reloadKey }) => useRfAnalysis(reloadKey),
      {
        initialProps: {
          reloadKey: 0,
        },
      },
    );

    await waitFor(() => {
      expect(mocks.fetchRfAnalysis).toHaveBeenCalledTimes(1);
    });

    rerender({
      reloadKey: 1,
    });

    await waitFor(() => {
      expect(mocks.fetchRfAnalysis).toHaveBeenCalledTimes(2);
    });
  });
});
