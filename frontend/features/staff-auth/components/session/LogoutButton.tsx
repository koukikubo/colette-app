"use client";

import { useState } from "react";

import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { Button } from "../../../../components/ui/button";

export function LogoutButton() {
  const { status, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated") {
    return null;
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setError(null);
      await logout();
    } catch {
      setError("ログアウトを確認できませんでした。再試行してください。");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "ログアウト中..." : "ログアウト"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
