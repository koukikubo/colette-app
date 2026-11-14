"use client";
import { useEffect, useState } from "react";
import { fetchStandardCodes } from "@/features/standard-codes/api/standard-code-api";
import type { StandardListCode } from "@/features/standard-codes/types";

// 絞り込みを開いた時とURLから条件を復元した時だけ選択肢を取得する。
// 過去の顧客割当を探す用途なので、無効ランクも除外しない。
export function useCustomerRankOptions(hasSelection: boolean) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<StandardListCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const enabled = open || hasSelection;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchStandardCodes(controller.signal);
        if (!controller.signal.aborted) {
          setOptions(
            response.data.standard_masters.find(
              (master) => master.system_key === "customer_rank",
            )?.items ?? [],
          );
        }
      } catch {
        if (!controller.signal.aborted)
          setError("顧客ランクの選択肢を取得できませんでした。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [enabled, attempt]);
  return {
    options,
    loading,
    error,
    onOpenChange: setOpen,
    retry: () => setAttempt((value) => value + 1),
  };
}
export type CustomerRankOptions = ReturnType<typeof useCustomerRankOptions>;
