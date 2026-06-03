"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/api/api-client";
import {
  fetchCurrentStaff,
  logoutStaff,
} from "@/features/staff-auth/components/Auth/api/staff-auth-api";
import type { Staff } from "@/features/staff-auth/components/Auth/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  staff: Staff | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  refreshCurrentStaff: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshCurrentStaff = useCallback(async () => {
    setStatus("loading");

    try {
      const response = await fetchCurrentStaff();

      setStaff(response.data.staff);

      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setStaff(null);
        setStatus("unauthenticated");
        return;
      }

      console.error(error);
      setStaff(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    let ignored = false;

    async function loadCurrentStaff() {
      try {
        const response = await fetchCurrentStaff();

        if (ignored) return;

        setStaff(response.data.staff);

        setStatus("authenticated");
      } catch (error) {
        if (ignored) return;

        if (error instanceof ApiClientError && error.status === 401) {
          setStaff(null);
          setStatus("unauthenticated");
          return;
        }

        console.error(error);
        setStaff(null);
        setStatus("unauthenticated");
      }
    }

    void loadCurrentStaff();

    return () => {
      ignored = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutStaff();
    } finally {
      setStaff(null);
      setStatus("unauthenticated");
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      staff,
      status,
      isAuthenticated: status === "authenticated",
      refreshCurrentStaff,
      logout,
    }),
    [staff, status, refreshCurrentStaff, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
