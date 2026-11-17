"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiRead } from "@/hooks/useApiRead";
import { Button } from "@/components/ui/button";

export type ReservationCalendarData = {
  month: string;
  days: { date: string; reservation_count: number; guest_count: number }[];
};
// 月の俯瞰から既存タイムラインへつなぐ。休業日など未保有の情報は補完しない。
export function ReservationCalendar({ targetDate }: { targetDate: string }) {
  const [month, setMonth] = useState(targetDate.slice(0, 7));
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useApiRead<ReservationCalendarData>(
    `/api/v1/reservation_calendar?month=${month}`,
    reload,
  );
  const offset = data ? new Date(`${data.month}-01T00:00:00Z`).getUTCDay() : 0;
  const max = Math.max(
    1,
    ...(data?.days.map((day) => day.reservation_count) ?? []),
  );
  return (
    <section className="colette-page">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            日付を選ぶと、その日のタイムラインを開きます。
          </p>
        </div>
        <Link
          className="text-primary underline underline-offset-4"
          href={`/reservations?date=${targetDate}`}
        >
          タイムラインへ
        </Link>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="reservation-month">表示月</label>
        <input
          id="reservation-month"
          className="rounded-md border border-input bg-card px-3 py-2"
          type="month"
          min="1900-01"
          max="2100-12"
          value={month}
          onChange={(e) => {
            if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);
          }}
        />
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setReload((v) => v + 1)}
        >
          更新
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        キャンセルを除く予約件数・予定人数。濃い面ほど予約が多い日です。
      </p>
      {loading ? (
        <p role="status">予約カレンダーを取得しています。</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-lg bg-card p-3 sm:p-5">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-7 text-center text-sm text-muted-foreground">
                {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                  <div key={day} className="p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offset }, (_, i) => (
                  <div key={`blank-${i}`} aria-hidden="true" />
                ))}
                {data.days.map((day) => (
                  <Link
                    key={day.date}
                    href={`/reservations?date=${day.date}`}
                    aria-label={`${day.date} 予約${day.reservation_count}件 ${day.guest_count}名のタイムライン`}
                    aria-current={day.date === targetDate ? "date" : undefined}
                    className="group relative flex min-h-28 flex-col gap-2 overflow-hidden rounded-md bg-muted/40 p-3 hover:ring-2 hover:ring-primary aria-[current=date]:ring-2 aria-[current=date]:ring-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 bg-primary/15"
                      style={{
                        height: `${(day.reservation_count / max) * 100}%`,
                      }}
                    />
                    <span className="relative font-semibold">
                      {Number(day.date.slice(-2))}
                    </span>
                    <span className="relative text-sm">
                      {day.reservation_count}件<br />
                      {day.guest_count}名
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </section>
  );
}
