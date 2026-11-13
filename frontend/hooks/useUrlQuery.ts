"use client";
import { useCallback, useSyncExternalStore } from "react";
const QUERY_EVENT = "colette:query-change";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(QUERY_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(QUERY_EVENT, listener);
  };
}
// URLを取得条件の正本にし、詳細から戻った場合や再読み込みでも再現する。
export function useUrlQuery() {
  const query = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const update = useCallback(
    (values: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(values).forEach(([key, value]) => {
        if (value == null || value === "") params.delete(key);
        else params.set(key, String(value));
      });
      const search = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
      );
      window.dispatchEvent(new Event(QUERY_EVENT));
    },
    [],
  );
  return { params: new URLSearchParams(query), update };
}
export function queryPage(value: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
