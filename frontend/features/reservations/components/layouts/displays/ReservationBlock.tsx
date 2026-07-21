import Link from "next/link";

import type { Reservation } from "@/features/reservations/types";

type ReservationBlockProps = {
  reservation: Reservation;

  /**
   * タイムライン左端から予約開始位置までの割合。
   *
   * 例：
   * 表示範囲が17:00〜24:00で、予約開始が18:00なら、
   * 17:00から18:00までの位置を割合で受け取る。
   */
  leftPercentage: number;

  /**
   * タイムライン全体に対する予約時間の横幅。
   *
   * 例：
   * 2時間の予約であれば、表示時間全体に対する
   * 2時間分の割合を受け取る。
   */
  widthPercentage: number;
};

/**
 * タイムライン上へ予約1件を表示するcp。
 *
 * このcpでは開始位置や横幅の計算は行わない。
 * 親のReservationTimelineRowで計算された値を受け取り、
 * 予約情報の表示と詳細画面への遷移を担当する。
 */
export function ReservationBlock({
  reservation,
  leftPercentage,
  widthPercentage,
}: ReservationBlockProps) {
  const startTime = formatReservationTime(reservation.starts_at);
  const endTime = formatReservationTime(reservation.ends_at);

  return (
    <Link
      href={`/reservations/${encodeURIComponent(String(reservation.id))}`}
      scroll={false}
      aria-label={`${reservation.reservation_name}様の予約詳細を開く`}
      className="bg-primary/10 border-primary/30 hover:bg-primary/20 focus-visible:ring-ring absolute inset-y-1 overflow-hidden rounded-md border px-2 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      style={{
        left: `${leftPercentage}%`,
        width: `${widthPercentage}%`,
      }}
    >
      <div className="truncate text-sm font-medium">
        {reservation.reservation_name}
      </div>

      <div className="text-muted-foreground truncate text-xs">
        {reservation.guest_count}名{" / "}
        {startTime}〜{endTime}
      </div>
    </Link>
  );
}

/**
 * Railsから返された日時を日本時間のHH:mm形式へ変換する。
 *
 * 現時点ではReservationBlock専用の処理として同じファイルに置く。
 * 他のcpでも再利用することが確定した場合にutilsへ移動する。
 */
function formatReservationTime(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
