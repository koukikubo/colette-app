import type { Reservation } from "@/features/reservations/types";

import { ReservationBlock } from "./ReservationBlock";

type ReservationTimelineRowProps = {
  // 行の左側に表示する名称。
  label: string;
  //席コードや定員などの補足情報。
  description?: string;
  // この行へ表示する予約一覧。
  reservations: Reservation[];
  // 現在表示している予約日。
  targetDate: string;
  // タイムラインの表示開始時刻を分で表す。例：10:00 → 600
  timelineStartMinutes: number;
  // タイムラインの表示終了時刻を分で表す。
  timelineEndMinutes: number;
  // タイムライン上部の時間目盛りを表示する。
  hourLabels: number[];
};

// 担当する処理：席名と補足情報の表示・予約開始時刻から左位置を計算・予約時間から横幅を計算・計算結果をReservationBlockへ渡す
export function ReservationTimelineRow({
  label,
  description,
  reservations,
  targetDate,
  timelineStartMinutes,
  timelineEndMinutes,
  hourLabels,
}: ReservationTimelineRowProps) {
  const timelineDurationMinutes = timelineEndMinutes - timelineStartMinutes;

  if (timelineDurationMinutes <= 0) {
    throw new Error("タイムライン終了時刻は開始時刻より後に設定してください。");
  }

  return (
    <section className="grid min-w-max grid-cols-[180px_1fr] border-b">
      {/* 席情報を表示する左側の固定領域 */}
      <div className="bg-background sticky left-0 z-20 flex min-h-20 flex-col justify-center border-r px-4 py-3">
        <p className="font-medium">{label}</p>

        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
      </div>

      {/*ReservationBlockはabsoluteで配置するため、 このdivをposition: relativeの基準にする。*/}
      <div className="relative min-h-20">
        {hourLabels.map((hour) => {
          const timelineDurationMinutes =
            timelineEndMinutes - timelineStartMinutes;

          const leftPercentage =
            ((hour - timelineStartMinutes) / timelineDurationMinutes) * 100;

          const isFullHour = hour % 60 === 0;

          return (
            <div
              key={hour}
              aria-hidden="true"
              className={[
                "pointer-events-none absolute inset-y-0 border-l",
                isFullHour ? "border-border" : "border-border/30",
              ].join(" ")}
              style={{
                left: `${leftPercentage}%`,
              }}
            />
          );
        })}

        {reservations.map((reservation) => {
          const position = calculateReservationPosition({
            reservation,
            targetDate,
            timelineStartMinutes,
            timelineEndMinutes,
          });

          // 表示範囲が17:00〜24:00以外は表示しない。
          if (!position) {
            return null;
          }

          return (
            <ReservationBlock
              key={reservation.id}
              reservation={reservation}
              leftPercentage={position.leftPercentage}
              widthPercentage={position.widthPercentage}
            />
          );
        })}

        {reservations.length === 0 ? (
          <p className="text-muted-foreground absolute inset-0 flex items-center px-4 text-sm">
            予約なし
          </p>
        ) : null}
      </div>
    </section>
  );
}

type CalculateReservationPositionParams = {
  reservation: Reservation;
  targetDate: string;
  timelineStartMinutes: number;
  timelineEndMinutes: number;
};

type ReservationPosition = {
  leftPercentage: number;
  widthPercentage: number;
};

/**
 * 予約の開始位置と横幅を、タイムライン全体に対する割合へ変換する。
 * 表示範囲：17:00〜24:00（420分）
 * 予約時間：17:00〜19:00
 *
 * 左位置：
 * 17:00から19:00まで120分
 * 120 ÷ 420 × 100 = 28.57%
 *
 * 横幅：
 * 17:00から19:00まで120分
 * 120 ÷ 420 × 100 = 28.57%
 */
function calculateReservationPosition({
  reservation,
  targetDate,
  timelineStartMinutes,
  timelineEndMinutes,
}: CalculateReservationPositionParams): ReservationPosition | null {
  const reservationStartMinutes = convertToTargetDateMinutes(
    reservation.starts_at,
    targetDate,
  );

  const reservationEndMinutes = convertToTargetDateMinutes(
    reservation.ends_at,
    targetDate,
  );

  /*
   * 予約の一部だけが表示時間内に入る場合、
   * タイムラインの範囲内だけを表示する。
   *
   * 例：
   * 表示開始17:00、予約開始16:30
   * → 17:00からブロックを表示する。
   */
  const visibleStartMinutes = Math.max(
    reservationStartMinutes,
    timelineStartMinutes,
  );

  const visibleEndMinutes = Math.min(reservationEndMinutes, timelineEndMinutes);

  //表示範囲と予約時間が重なっていない場合は描画しない。
  if (visibleEndMinutes <= visibleStartMinutes) {
    return null;
  }

  const timelineDurationMinutes = timelineEndMinutes - timelineStartMinutes;

  const leftPercentage =
    ((visibleStartMinutes - timelineStartMinutes) / timelineDurationMinutes) *
    100;

  const widthPercentage =
    ((visibleEndMinutes - visibleStartMinutes) / timelineDurationMinutes) * 100;

  return {
    leftPercentage,
    widthPercentage,
  };
}

/**
 * ISO 8601形式の日時を、
 * targetDateの午前0時から何分経過しているかへ変換する。
 *
 * Asia/Tokyoを明示することで、ブラウザや実行環境の
 * タイムゾーンによる位置ずれを防ぐ。
 *
 * 翌日0:30まで続く予約の場合は、
 * 30分ではなく「翌日の30分後」＝1470分として扱う。
 */
function convertToTargetDateMinutes(value: string, targetDate: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(value));

  const year = findDatePart(parts, "year");
  const month = findDatePart(parts, "month");
  const day = findDatePart(parts, "day");
  const hour = findDatePart(parts, "hour");
  const minute = findDatePart(parts, "minute");

  const [targetYear, targetMonth, targetDay] = targetDate
    .split("-")
    .map(Number);

  const reservationDate = Date.UTC(year, month - 1, day);
  const targetDateValue = Date.UTC(targetYear, targetMonth - 1, targetDay);
  const dayDifference =
    (reservationDate - targetDateValue) / (24 * 60 * 60 * 1000);

  return dayDifference * 24 * 60 + hour * 60 + minute;
}

// targetDateの午前0時から何分経過しているかを返す。
function findDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`予約日時から${type}を取得できませんでした。`);
  }

  return Number(value);
}
