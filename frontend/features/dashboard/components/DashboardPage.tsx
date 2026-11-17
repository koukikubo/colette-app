"use client";
import { useApiRead } from "@/hooks/useApiRead";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
type Dashboard = {
  date: string;
  summary: {
    reservation_count: number;
    expected_guest_count: number;
    completed_count: number;
    canceled_count: number;
    unassigned_count: number;
    unconfirmed_count: number;
  };
};

export function DashboardPage() {
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApiRead<Dashboard>(
    "/api/v1/dashboard",
    reload,
  );
  // 定期・フォーカス復帰時の再取得はしない。画面表示時と明示的な更新で取得する。
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">本日の予約状況</h1>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
        >
          最新情報に更新
        </Button>
      </header>
      {loading ? (
        <p role="status">予約状況を取得しています。</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        data && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["予約件数", data.summary.reservation_count, "件"],
                  [
                    "来店予定人数（未完了）",
                    data.summary.expected_guest_count,
                    "名",
                  ],
                  ["席未割当", data.summary.unassigned_count, "件"],
                  ["詳細未確認", data.summary.unconfirmed_count, "件"],
                  ["対応完了", data.summary.completed_count, "件"],
                  ["キャンセル", data.summary.canceled_count, "件"],
                ] as const
              ).map(([label, value, unit]) => (
                <div className="rounded border p-4" key={label}>
                  <h2 className="text-sm text-muted-foreground">{label}</h2>
                  <p className="text-2xl font-semibold">
                    {value}
                    {unit}
                  </p>
                </div>
              ))}
            </div>
            <nav className="flex gap-4">
              <Link
                className="underline"
                href={`/reservations?date=${data.date}`}
              >
                本日の予約一覧
              </Link>
              <PermissionGate resource="reservations">
                <Link
                  className="underline"
                  href={`/reservations/new?date=${data.date}`}
                >
                  新規予約
                </Link>
              </PermissionGate>
            </nav>
          </>
        )
      )}
    </main>
  );
}
