import type { Reservation } from "@/features/reservations/type";
import { ReservationTimelineRow } from "./ReservationTimelineRow";
import { ReservationTableRow } from "@/features/restaurant-masters/types";

/**
 * 初期実装では、タイムラインの表示時間を17:00〜24:00に固定する。
 *
 * 将来的に店舗設定から営業時間を取得できるようになった場合は、
 * この定数を設定値へ置き換える。
 */
const TIMELINE_START_HOUR = 17;
const TIMELINE_END_HOUR = 24;
//タイムライン1時間分の横幅
const HOUR_WIDTH_PX = 96;
//タイムラインの最小メモリ
const TIMELINE_INTERVAL_MINUTES = 15;
//席情報を表示する左側領域の横幅
const TABLE_LABEL_WIDTH_PX = 180;

type ReservationTimelineProps = {
  //席マスタごとに予約をまとめた表示用データ。
  tableRows: ReservationTableRow[];
  //実テーブルがまだ決まっていない予約
  unassignedReservations: Reservation[];
  //現在表示している対象日。
  targetDate: string;
};

/**
 * 予約タイムライン全体を表示するcp。
 *
 * 担当する処理：
 * ・時間ヘッダーの表示
 * ・席ごとのタイムライン行の表示
 * ・席未割当行の表示
 * ・横スクロール領域の管理
 */
export function ReservationTimeline({
  tableRows,
  unassignedReservations,
  targetDate,
}: ReservationTimelineProps) {
  const timelineStartMinutes = TIMELINE_START_HOUR * 60;
  const timelineEndMinutes = TIMELINE_END_HOUR * 60;

  const timelineHourCount = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
  const timelineWidthPx = timelineHourCount * HOUR_WIDTH_PX;

  const totalWidthPx = TABLE_LABEL_WIDTH_PX + timelineWidthPx;

  const hourLabels = createHourLabels(
    timelineStartMinutes,
    timelineEndMinutes,
    TIMELINE_INTERVAL_MINUTES,
  );
  // 基本コードマスタ順でテーブルを表示するため、席マスタの連番順でソートする。
  const sortedTableRows = [...tableRows].sort((firstRow, secondRow) => {
    const typeDifference =
      firstRow.restaurantMaster.restaurant_master_type_id -
      secondRow.restaurantMaster.restaurant_master_type_id;

    if (typeDifference !== 0) {
      return typeDifference;
    }

    return (
      firstRow.restaurantMaster.sequence_number -
      secondRow.restaurantMaster.sequence_number
    );
  });

  return (
    <div className="overflow-hidden rounded-lg border">
      {/*表示時間が長いため、タイムライン部分を横スクロール可能にする。*/}
      <div className="overflow-x-auto">
        <div
          className="min-w-max"
          style={{
            minWidth: `${totalWidthPx}px`,
          }}
        >
          <TimelineHeader
            hourLabels={hourLabels}
            timelineStartMinutes={timelineStartMinutes}
            timelineEndMinutes={timelineEndMinutes}
          />

          {sortedTableRows.map((row) => (
            <ReservationTimelineRow
              key={row.restaurantMaster.id}
              label={row.restaurantMaster.name}
              description={[
                row.restaurantMaster.code,
                `定員${row.restaurantMaster.capacity}名`,
              ].join(" / ")}
              reservations={row.reservations}
              targetDate={targetDate}
              timelineStartMinutes={timelineStartMinutes}
              timelineEndMinutes={timelineEndMinutes}
              hourLabels={hourLabels}
            />
          ))}

          {/* 席未割当予約が存在する場合だけ、通常席とは異なる点線の行として表示する */}
          {unassignedReservations.length > 0 ? (
            <ReservationTimelineRow
              label="席未割当"
              description="実テーブル未確定"
              reservations={unassignedReservations}
              targetDate={targetDate}
              timelineStartMinutes={timelineStartMinutes}
              timelineEndMinutes={timelineEndMinutes}
              hourLabels={hourLabels}
              dashed
            />
          ) : null}

          {tableRows.length === 0 && unassignedReservations.length === 0 ? (
            <div className="p-6">
              <p className="text-muted-foreground text-sm">
                表示できる席がありません。
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type TimelineHeaderProps = {
  hourLabels: number[];
  timelineStartMinutes: number;
  timelineEndMinutes: number;
};

// タイムライン上部の時間目盛りを表示する。同じ180px幅の空白領域を設ける。
function TimelineHeader({
  hourLabels,
  timelineStartMinutes,
  timelineEndMinutes,
}: TimelineHeaderProps) {
  const durationMinutes = timelineEndMinutes - timelineStartMinutes;

  return (
    <div className="grid grid-cols-[180px_1fr] border-b">
      <div className="bg-background sticky left-0 z-30 flex h-12 items-center border-r px-4">
        <p className="text-sm font-medium">席</p>
      </div>

      <div className="bg-muted/30 relative h-12 w-full">
        {hourLabels.map((hour, index) => {
          const leftPercentage =
            ((hour - timelineStartMinutes) / durationMinutes) * 100;

          const isFirst = index === 0;
          const isLast = index === hourLabels.length - 1;
          const isFullHour = hour % 60 === 0;

          return (
            <div
              key={hour}
              className={[
                "absolute inset-y-0 border-l",
                isFullHour ? "border-border" : "border-border/30",
              ].join(" ")}
              style={{
                left: `${leftPercentage}%`,
              }}
            >
              {isFullHour ? (
                <span
                  className={[
                    "text-muted-foreground absolute top-1 text-xs whitespace-nowrap",
                    isFirst
                      ? "left-1"
                      : isLast
                        ? "right-1"
                        : "-translate-x-1/2",
                  ].join(" ")}
                >
                  {formatHourLabel(hour)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 開始時刻から終了時刻までの時間目盛りを指定された分単位で作成。
function createHourLabels(
  startMinutes: number,
  endMinutes: number,
  intervalMinutes: number,
): number[] {
  return Array.from(
    {
      length: Math.floor((endMinutes - startMinutes) / intervalMinutes) + 1,
    },
    (_, index) => startMinutes + index * intervalMinutes,
  );
}

// 数値の時間を画面表示用のHH:00へ変換する。24時は「24:00」と表示する。
function formatHourLabel(hour: number): string {
  const hours = Math.floor(hour / 60);
  const minutes = hour % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
