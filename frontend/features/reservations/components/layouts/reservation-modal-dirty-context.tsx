"use client";
import { createContext, useContext, useEffect } from "react";

export const ReservationModalDirtyContext = createContext<
  ((dirty: boolean) => void) | null
>(null);

// 通常ページでは何もしない。モーダルでは実際の入力差分を共有し、ボタンによる変更も保護する。
export function useReservationModalDirty(dirty: boolean) {
  const notify = useContext(ReservationModalDirtyContext);
  useEffect(() => {
    notify?.(dirty);
    return () => notify?.(false);
  }, [dirty, notify]);
}
