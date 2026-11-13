"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/api-client";
import {
  SESSION_EXPIRED_EVENT,
  SESSION_RESUMED_EVENT,
} from "@/lib/api/session-events";
import { fetchCurrentStaff, logoutStaff } from "../api/staff-auth-api";
import type { Staff } from "../types";
import { SessionReauthentication } from "../components/session/SessionReauthentication";

export type AuthStatus =
  "loading" | "authenticated" | "unauthenticated" | "expired" | "error";
type AuthContextValue = {
  staff: Staff | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  authError: string | null;
  refreshCurrentStaff: () => Promise<void>;
  logout: () => Promise<void>;
};
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const current = useRef<Staff | null>(null);
  const expired = useRef(false);
  const mounted = useRef(true);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);

  const expire = useCallback(() => {
    // 認証済み画面はアンマウントしない。個人情報を永続ストレージへ退避しない。
    expired.current = Boolean(current.current);
    setStatus(current.current ? "expired" : "unauthenticated");
  }, []);
  const refreshCurrentStaff = useCallback(async () => {
    try {
      const response = await fetchCurrentStaff();
      if (!mounted.current) return;
      if (current.current && response.data.staff.id !== current.current.id) {
        expire();
        throw new Error(
          "担当者が変更されています。入力を破棄してログインし直してください。",
        );
      }
      current.current = response.data.staff;
      setStaff(response.data.staff);
      setStatus("authenticated");
      setAuthError(null);
      if (expired.current)
        window.dispatchEvent(new Event(SESSION_RESUMED_EVENT));
      expired.current = false;
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiClientError && error.status === 401) expire();
      else {
        setAuthError(
          "認証状態を確認できませんでした。接続を確認して再取得してください。",
        );
        if (!current.current) setStatus("error");
      }
      throw error;
    }
  }, [expire]);

  useEffect(() => {
    mounted.current = true;
    void refreshCurrentStaff().catch(() => undefined);
    const check = () => {
      if (document.visibilityState === "visible" && current.current)
        void refreshCurrentStaff().catch(() => undefined);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      mounted.current = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [expire, refreshCurrentStaff]);

  const logout = useCallback(async () => {
    await logoutStaff();
    current.current = null;
    expired.current = false;
    setStaff(null);
    setStatus("unauthenticated");
    setAuthError(null);
    router.replace("/login");
  }, [router]);
  const value = useMemo(
    () => ({
      staff,
      status,
      authError,
      isAuthenticated: status === "authenticated",
      refreshCurrentStaff,
      logout,
    }),
    [staff, status, authError, refreshCurrentStaff, logout],
  );
  return (
    <AuthContext.Provider value={value}>
      {authError && staff && (
        <div role="alert" className="border p-3">
          {authError}
          <button
            onClick={() => void refreshCurrentStaff().catch(() => undefined)}
          >
            認証状態を再取得
          </button>
        </div>
      )}
      {children}
      {status === "expired" && staff && (
        <SessionReauthentication
          staff={staff}
          resume={refreshCurrentStaff}
          logout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}
