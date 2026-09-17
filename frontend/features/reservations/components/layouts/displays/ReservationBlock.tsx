import Link from "next/link";
import type { Reservation } from "@/features/reservations/types";
import { formatReservationTime } from "@/features/reservations/utils/reservation-date";
import type {
  NextReservationWarning,
  ReservationTimelineState,
} from "@/features/reservations/utils/reservation-timeline-state";
import { ReservationWarningDialog } from "./ReservationWarningDialog";
import { ReservationTimelineActionMenu } from "./ReservationTimelineActionMenu";

type ReservationBlockProps = {
  reservation: Reservation;

  // タイムライン左端から予約開始位置までの割合。
  leftPercentage: number;
  // タイムライン全体に対する予約時間の横幅。
  widthPercentage: number;

  timelineState: ReservationTimelineState;
  progressPercentage: number;
  nextReservationWarning: NextReservationWarning | null;
  onReservationStatusChanged?: () => void;
};

const timelineStateClassNames: Record<ReservationTimelineState, string> = {
  upcoming:
    "border-sky-300 bg-sky-50 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:hover:bg-sky-900",
  in_progress:
    "border-emerald-400 bg-emerald-100 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900",
  overdue:
    "border-amber-400 bg-amber-100 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950 dark:hover:bg-amber-900",
  completed:
    "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
  canceled: "hidden",
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
  timelineState,
  progressPercentage,
  nextReservationWarning,
  onReservationStatusChanged,
}: ReservationBlockProps) {
  const startTime = formatReservationTime(reservation.starts_at);
  const endTime = formatReservationTime(reservation.ends_at);
  return (
    <div
      data-reservation-block
      data-timeline-state={timelineState}
      data-progress-percentage={progressPercentage}
      className={[
        "absolute inset-y-1 overflow-hidden rounded-md border transition-colors",
        timelineStateClassNames[timelineState],
      ].join(" ")}
      style={{
        left: `${leftPercentage}%`,
        width: `${widthPercentage}%`,
      }}
    >
      <Link
        href={`/reservations/${encodeURIComponent(String(reservation.id))}`}
        scroll={false}
        aria-label={`${reservation.reservation_name}様の予約詳細を開く`}
        className={[
          "focus-visible:ring-ring absolute inset-0 overflow-hidden rounded-md px-2 py-1 text-left focus-visible:ring-2 focus-visible:outline-none",
          nextReservationWarning ? "pr-16" : "pr-9",
        ].join(" ")}
      >
        {timelineState === "in_progress" ? (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-emerald-300/70 transition-[width] duration-500 dark:bg-emerald-700/50"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        ) : null}

        <div className="relative z-10 flex items-center gap-1 text-sm font-medium">
          <span className="truncate">{reservation.reservation_name}</span>
        </div>

        <div className="text-muted-foreground relative z-10 truncate text-xs">
          {reservation.guest_count}名{" / "}
          {startTime}〜{endTime}
        </div>
      </Link>
      <div className="absolute right-1 top-1 z-20 flex items-center gap-1">
        {nextReservationWarning ? (
          <ReservationWarningDialog
            reservationName={reservation.reservation_name}
            nextReservationId={nextReservationWarning.nextReservationId}
            minutesUntilNextReservation={
              nextReservationWarning.minutesUntilNextReservation
            }
          />
        ) : null}

        <ReservationTimelineActionMenu
          reservation={reservation}
          onReservationStatusChanged={onReservationStatusChanged}
        />
      </div>
    </div>
  );
}
