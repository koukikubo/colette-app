"use client";
import { useEffect, useState } from "react";
import {
  apiFetch,
  ApiClientError,
  type ApiSuccessResponse,
} from "@/lib/api/api-client";
// 条件が変わった時点で旧結果を表示対象から外す。中止した応答は取り込まない。
export function useApiRead<T>(path: string, reload = 0) {
  const key = `${path}:${reload}`;
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string;
  }>({ key: "", data: null, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<ApiSuccessResponse<T>>(path, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted)
          setResult({ key, data: response.data, error: "" });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            data: null,
            error:
              failure instanceof ApiClientError
                ? [failure.message, ...failure.errorMessages].join(" ")
                : "データを取得できませんでした。接続を確認して再取得してください。",
          });
      });
    return () => controller.abort();
  }, [path, key]);
  const isLoading = result.key !== key;
  return {
    data: isLoading ? null : result.data,
    error: isLoading ? "" : result.error,
    loading: isLoading,
  };
}
