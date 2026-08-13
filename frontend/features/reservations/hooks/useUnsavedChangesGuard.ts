"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NavigationAction = () => void;

// 未保存の変更がある場合に、画面移動前の確認を管理する。
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  // 確認後に実行する画面移動処理を一時的に保持する。
  const pendingActionRef = useRef<NavigationAction | null>(null);

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

  // 未保存変更がなければそのまま移動し、あれば確認Dialogを開く。
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
