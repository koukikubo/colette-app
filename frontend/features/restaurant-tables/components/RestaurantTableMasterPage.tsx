"use client";
import * as React from "react";
import { Armchair, CircleAlert, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchRestaurantTables } from "@/features/restaurant-tables/api/restaurant-tables-api";

import type { RestaurantTable } from "@/features/restaurant-tables/types";
import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantTableMasterPage() {
  const [restaurantTables, setRestaurantTables] = React.useState<
    RestaurantTable[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const hasRestaurantTables = restaurantTables.length > 0;

  React.useEffect(() => {
    let cancelled = false;

    void fetchRestaurantTables()
      .then((response) => {
        if (cancelled) return;

        setRestaurantTables(response.data.restaurant_tables);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;

        console.error("席マスタ一覧の取得に失敗しました。", caughtError);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "席マスタ一覧の取得に失敗しました。",
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            席マスタ管理
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            店舗で使用する席・テーブルを管理します。
          </p>
        </div>

        <Button type="button">
          <Plus className="size-4" />
          席を登録
        </Button>
      </div>

      <div className="rounded-lg border bg-card" aria-live="polite">
        {isLoading && (
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>

            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex gap-3 p-6">
            <CircleAlert
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden="true"
            />

            <div className="space-y-1">
              <p className="font-medium text-destructive">
                席マスタを取得できませんでした
              </p>

              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && !hasRestaurantTables && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Armchair
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="font-medium">登録されている席はありません</p>

            <p className="mt-1 text-sm text-muted-foreground">
              「席を登録」から最初の席を登録してください。
            </p>
          </div>
        )}

        {!isLoading && !error && hasRestaurantTables && (
          <div className="p-6">
            <pre className="overflow-x-auto text-xs">
              {JSON.stringify(restaurantTables, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
