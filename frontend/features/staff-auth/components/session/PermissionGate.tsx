"use client";
import { useContext, type ReactNode } from "react";
import { AuthContext } from "../../providers/AuthProvider";
export type WriteResource = "customers" | "reservations" | "masters";
export function canWrite(role: string | undefined, resource: WriteResource) {
  return role === "owner" || (role === "operator" && resource !== "masters");
}
// 表示制御の共通境界。認可自体はRailsが強制する。期限切れ中は入力を保持する。
export function PermissionGate({
  resource,
  children,
  fallback = null,
}: {
  resource: WriteResource;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const auth = useContext(AuthContext);
  return canWrite(auth?.staff?.staff_master.role_code, resource)
    ? children
    : fallback;
}
