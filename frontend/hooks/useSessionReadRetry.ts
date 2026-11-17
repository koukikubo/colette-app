"use client";
import { useEffect, useState } from "react";
import { SESSION_RESUMED_EVENT } from "@/lib/api/session-events";

// 認証切れで失敗した読取だけを回復する。取得済みフォームの再初期化や更新再送はしない。
export function useSessionReadRetry(unauthorized: boolean) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!unauthorized) return;
    const retry = () => setRevision((value) => value + 1);
    window.addEventListener(SESSION_RESUMED_EVENT, retry);
    return () => window.removeEventListener(SESSION_RESUMED_EVENT, retry);
  }, [unauthorized]);
  return revision;
}
