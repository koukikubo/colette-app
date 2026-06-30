"use client";

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchStaffLoginOptions } from "./api/staff-auth-api";
import { LoginForm } from "./login-form";
import { StaffOption } from "./types";

export function LoginFormContainer() {
  const [staffOptions, setStaffOptions] = React.useState<StaffOption[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void fetchStaffLoginOptions()
      .then((response) => {
        if (cancelled) return;

        setStaffOptions(response.data.staff_options);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("ログイン担当者候補の取得に失敗しました。", error);

        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "担当者候補の取得に失敗しました。",
        );
      })
      .finally(() => {
        if (cancelled) return;

        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div
        className="space-y-6 rounded-lg border bg-card p-6"
        aria-live="polite"
      >
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="rounded-lg border border-destructive/50 bg-destructive/5 p-6"
        role="alert"
      >
        <h1 className="font-semibold">担当者情報を取得できませんでした</h1>

        <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  if (staffOptions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6" role="status">
        <h1 className="font-semibold">ログイン可能な担当者がいません</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          管理者へお問い合わせください。
        </p>
      </div>
    );
  }

  return <LoginForm staffOptions={staffOptions} />;
}
