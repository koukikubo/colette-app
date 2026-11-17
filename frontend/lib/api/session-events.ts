// API層はReactに依存せず、認証切れだけを通知する。更新の自動再送はしない。
export const SESSION_EXPIRED_EVENT = "colette:session-expired";
export const SESSION_RESUMED_EVENT = "colette:session-resumed";
export function notifySessionExpired() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/dashboard";
  const target = new URL(value, "https://colette.invalid");
  // 正規化後のパスでも検証し、外部URLやAPI・ログインへの誘導を許可しない。
  if (
    target.origin !== "https://colette.invalid" ||
    !/^\/(dashboard|customers|reservations|rf-analysis|rf-customer-transitions|rf-customers|rf-rank-drops|rf-management|standard-codes|staff-masters|restaurant-masters|account)(\/|$)/.test(
      target.pathname,
    )
  )
    return "/dashboard";
  return target.pathname + target.search + target.hash;
}
