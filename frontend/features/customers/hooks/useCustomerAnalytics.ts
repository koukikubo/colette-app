"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCustomerAnalytics } from "../api/customer-api";
import type { CustomerAnalyticsData } from "../types";

// 検索結果と初期画面の集計は別取得。古い応答で最新の画面を上書きしない。
export function useCustomerAnalytics(enabled: boolean) {
  const [data, setData] = useState<CustomerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCustomerAnalytics();
      if (generation.current === current) setData(response.data);
    } catch (error) {
      if (generation.current === current)
        setError("顧客の集計を取得できませんでした。");
      throw error;
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, []);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    let active = true;
    if (enabled)
      void Promise.resolve()
        .then(() => (active ? refresh() : undefined))
        .catch(() => undefined);
    return () => {
      active = false;
      invalidate();
    };
  }, [enabled, refresh, invalidate]);
  return { data, loading, error, refresh };
}
