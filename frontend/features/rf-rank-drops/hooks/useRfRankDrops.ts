"use client";

// RFランク低下顧客のAPI取得と、取得中・成功・失敗の状態を管理する。
// 一覧コンポーネントから条件を受け取り、rf-rank-drop-api.tsへ渡す。

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfRankDrops } from "../api/rf-rank-drop-api";
import type { RfRankDropData, RfRankDropParams } from "../types/rf-rank-drop";

type UseRfRankDropsOptions = RfRankDropParams & {
  // 同じ検索条件で再取得するときに、画面側で値を変更する。
  reloadKey?: number;
};

/**
 * 一覧画面から受け取った条件に応じて、RFランク低下顧客を取得する。
 * 取得結果と表示状態を返し、実際の描画は呼び出し元に任せる。
 */
export function useRfRankDrops({
  start_date,
  end_date,
  page = 1,
  per_page = 20,
  reloadKey = 0,
}: UseRfRankDropsOptions = {}) {
  const [data, setData] = useState<RfRankDropData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // この取得処理専用のキャンセル操作を用意する。
    const controller = new AbortController();

    /**
     * API関数を呼び出し、結果またはエラーを画面用の状態へ反映する。
     * キャンセル済みの通信からは、状態を更新しない。
     */
    async function loadRankDrops() {
      setIsLoading(true);
      setErrorMessage(null);
      setData(null);

      try {
        const response = await fetchRfRankDrops(
          {
            start_date,
            end_date,
            page,
            per_page,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setData(response.data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setErrorMessage(
          error instanceof ApiClientError
            ? [error.message, ...error.errorMessages].join(" / ")
            : "RFランク低下顧客を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRankDrops();

    // 条件変更時と画面を離れたときに、前の取得処理をキャンセルする。
    return () => {
      controller.abort();
    };
  }, [start_date, end_date, page, per_page, reloadKey]);

  return {
    data,
    isLoading,
    errorMessage,
  };
}
