"use client";
import { useApiRead } from "@/hooks/useApiRead";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import type { Reservation } from "@/features/reservations/types";
type Dashboard = {
  date: string;
  as_of: string;
  summary: {
    reservation_count: number;
    expected_guest_count: number;
    completed_count: number;
    canceled_count: number;
    unassigned_count: number;
    unconfirmed_count: number;
  };
  reservations: Reservation[];
  rf: {
    base_date: string | null;
    monthly_state: string | null;
    monthly_error: string | null;
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
            <p>
              {data.date} ／ 最終取得{" "}
              {new Date(data.as_of).toLocaleTimeString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })}
            </p>
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
            <section className="rounded border p-4">
              <h2 className="mb-3 font-semibold">
                本日の未完了予約（開始時刻順・最大10件）
              </h2>
              {data.reservations.length === 0 ? (
                <p>本日の未完了予約はありません。</p>
              ) : (
                <ul className="space-y-3">
                  {data.reservations.map((row) => (
                    <li key={row.id}>
                      <Link
                        className="underline"
                        href={`/reservations/${row.id}`}
                      >
                        {new Date(row.starts_at).toLocaleTimeString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {row.reservation_name} ／ {row.guest_count}名
                      </Link>
                      {row.restaurant_master_ids.length === 0 && (
                        <span className="ml-2">席未割当</span>
                      )}
                      {!row.details_confirmed_at && (
                        <span className="ml-2">詳細未確認</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <p>
              RFの適用基準日：{data.rf.base_date ?? "未適用"} ／ 月次自動更新：
              {(
                {
                  applied: "適用済み",
                  pending: "処理待ち",
                  failed: "失敗",
                  conflict: "手動確認が必要",
                } as Record<string, string>
              )[data.rf.monthly_state ?? ""] ?? "実行履歴なし"}
            </p>
            {data.rf.monthly_error && (
              <p role="alert">
                {data.rf.monthly_error}{" "}
                <Link className="underline" href="/rf-management">
                  RF管理で確認
                </Link>
              </p>
            )}
          </>
        )
      )}
    </main>
  );
}
