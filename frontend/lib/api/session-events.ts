// API層はReactに依存せず、認証切れだけを通知する。更新の自動再送はしない。
export const SESSION_EXPIRED_EVENT = "colette:session-expired";
export const SESSION_RESUMED_EVENT = "colette:session-resumed";
export function notifySessionExpired() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function safeReturnPath(value: string | null) {
  return value &&
    /^\/(dashboard|customers|reservations|rf-analysis|rf-customer-transitions|rf-rank-drops|rf-management|standard-codes|staff-masters|restaurant-masters|account)(\/|\?|$)/.test(
      value,
    ) &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}
