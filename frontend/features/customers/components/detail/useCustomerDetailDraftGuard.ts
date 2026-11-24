"use client";
import { useEffect, useRef } from "react";

// 同一URLの保護用履歴を1件置き、Backがページを離れる前に破棄確認する。
// 保存後のBackでは保護用履歴を読み飛ばす。タブ切替はreplaceStateなので入力を維持する。
export function useCustomerDetailDraftGuard(isDirty: boolean) {
  const dirty = useRef(false);
  const guarded = useRef(false);
  const restoring = useRef(false);
  const leaving = useRef(false);
  useEffect(() => {
    dirty.current = isDirty;
    if (isDirty && !guarded.current) {
      window.history.pushState(
        { ...window.history.state },
        "",
        window.location.href,
      );
      guarded.current = true;
    }
  }, [isDirty]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (!dirty.current || leaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const link = (event: MouseEvent) => {
      if (
        !dirty.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      if (!window.confirm("未保存の入力を破棄して移動しますか？")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const pop = () => {
      if (!guarded.current || leaving.current) return;
      if (restoring.current) {
        restoring.current = false;
        return;
      }
      if (
        dirty.current &&
        !window.confirm("未保存の入力を破棄して移動しますか？")
      ) {
        restoring.current = true;
        window.history.forward();
        return;
      }
      leaving.current = true;
      window.history.back();
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", pop);
    document.addEventListener("click", link, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", pop);
      document.removeEventListener("click", link, true);
    };
  }, []);
}
