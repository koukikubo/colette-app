"use client";
import { useEffect, useRef } from "react";
import { SESSION_RESUMED_EVENT } from "@/lib/api/session-events";
// 読取専用の再取得だけに使う。編集中の画面は呼出側がenabled=falseにする。
export function useReadRefresh(refresh: () => void, enabled = true) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return;
    const refreshVisible = () => {
      if (
        document.visibilityState === "visible" &&
        !document.querySelector('[role="dialog"], [role="alertdialog"]')
      )
        latest.current();
    };
    const timer = window.setInterval(refreshVisible, 30_000);
    const resume = () => window.setTimeout(refreshVisible, 0);
    window.addEventListener("focus", refreshVisible);
    window.addEventListener(SESSION_RESUMED_EVENT, resume);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener(SESSION_RESUMED_EVENT, resume);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [enabled]);
}
