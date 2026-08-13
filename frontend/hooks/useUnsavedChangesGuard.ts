"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NavigationAction = () => void;

// 未保存の変更がある場合に、画面移動前の確認を管理する。
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  // 確認後に実行する画面移動処理を一時的に保持する。
  const pendingActionRef = useRef<NavigationAction | null>(null);

  const requestNavigation = useCallback(
    (action: NavigationAction) => {
      if (!isDirty) {
        action();
        return;
      }

      pendingActionRef.current = action;
      setDiscardDialogOpen(true);
    },
    [isDirty],
  );

  // 再読み込み・タブを閉じる操作にはブラウザ標準の確認を表示する。
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // サイドバーなどのアプリ内リンクも、未保存確認の対象にする。
  useEffect(() => {
    if (!isDirty) return;

    function handleLinkClick(event: MouseEvent) {
      // 左クリック以外や、新しいタブを開く操作は対象外にする。
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);

      // 外部サイトへのリンクはブラウザ標準確認に任せる。
      if (destination.origin !== window.location.origin) return;

      // 同じページ内のアンカー移動では確認しない。
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();

      requestNavigation(() => {
        router.push(
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
      });
    }

    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [isDirty, requestNavigation, router]);

  // 入力内容を破棄し、保留していた画面移動を実行する。
  const confirmDiscard = useCallback(() => {
    const pendingAction = pendingActionRef.current;

    pendingActionRef.current = null;
    setDiscardDialogOpen(false);
    pendingAction?.();
  }, []);

  // Dialogを閉じた場合は、保留していた画面移動も取り消す。
  const handleDiscardDialogOpenChange = useCallback((open: boolean) => {
    setDiscardDialogOpen(open);

    if (!open) {
      pendingActionRef.current = null;
    }
  }, []);

  return {
    discardDialogOpen,
    requestNavigation,
    confirmDiscard,
    handleDiscardDialogOpenChange,
  };
}
