"use client";

import { useState } from "react";

import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { Button } from "../ui/button";

export function LogoutButton() {
  const { status, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (status !== "authenticated") {
    return null;
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}
