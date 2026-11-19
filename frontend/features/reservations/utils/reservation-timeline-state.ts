export type ReservationTimelineState =
  "upcoming" | "in_progress" | "overdue" | "completed" | "canceled";

type TimelineStateReservation = {
  starts_at: string;
  ends_at: string;
  completed_at: string | null;
  canceled_at: string | null;
};

export function getReservationTimelineState(
  reservation: TimelineStateReservation,
  now: Date,
): ReservationTimelineState {
  if (reservation.canceled_at !== null) {
    return "canceled";
  }

  if (reservation.completed_at !== null) {
    return "completed";
  }

  const startsAt = new Date(reservation.starts_at);
  const endsAt = new Date(reservation.ends_at);
  const currentTime = now.getTime();

  if (currentTime < startsAt.getTime()) {
    return "upcoming";
  }

  if (currentTime < endsAt.getTime()) {
    return "in_progress";
  }

  return "overdue";
}

type ReservationProgress = Pick<
  TimelineStateReservation,
  "starts_at" | "ends_at"
>;

export function getReservationProgressPercentage(
  reservation: ReservationProgress,
  now: Date,
): number {
  const startsAt = new Date(reservation.starts_at).getTime();
  const endsAt = new Date(reservation.ends_at).getTime();
  const currentTime = now.getTime();

  const duration = endsAt - startsAt;

  if (duration <= 0) {
    return 0;
  }

  const elapsed = currentTime - startsAt;
  const progress = (elapsed / duration) * 100;

  return Math.min(Math.max(progress, 0), 100);
}

type WarningReservation = TimelineStateReservation & {
  id: number;
};

export type NextReservationWarning = {
  nextReservationId: number;
  minutesUntilNextReservation: number;
};

const WARNING_THRESHOLD_MINUTES = 15;
const MILLISECONDS_PER_MINUTE = 60_000;

export function findNextReservationWarning(
  currentReservation: WarningReservation,
  reservations: WarningReservation[],
  now: Date,
): NextReservationWarning | null {
  const currentState = getReservationTimelineState(currentReservation, now);

  if (currentState !== "overdue") {
    return null;
  }

  const nextReservation = findNextScheduledReservation(
    currentReservation,
    reservations,
  );

  if (!nextReservation) {
    return null;
  }

  const minutesUntilNextReservation = Math.ceil(
    (new Date(nextReservation.starts_at).getTime() - now.getTime()) /
      MILLISECONDS_PER_MINUTE,
  );

  if (minutesUntilNextReservation > WARNING_THRESHOLD_MINUTES) {
    return null;
  }

  return {
    nextReservationId: nextReservation.id,
    minutesUntilNextReservation,
  };
}

// 表示の延長で後続予約を覆わないため、同じ席の次の予定を取得する。
export function findNextScheduledReservation(
  current: WarningReservation,
  reservations: WarningReservation[],
): WarningReservation | undefined {
  return reservations
    .filter(
      (reservation) =>
        reservation.id !== current.id &&
        !reservation.completed_at &&
        !reservation.canceled_at &&
        new Date(reservation.starts_at).getTime() >=
          new Date(current.ends_at).getTime(),
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )[0];
}

// 実入店を推測せず、予定からの経過と退店を記録した日時を区別する。
export function getReservationTimingLabel(
  reservation: TimelineStateReservation,
  now: Date,
): string | null {
  const state = getReservationTimelineState(reservation, now);
  if (state === "completed")
    return `退店処理 ${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(reservation.completed_at!))}`;
  if (state === "in_progress")
    return `予定開始から${Math.floor((now.getTime() - new Date(reservation.starts_at).getTime()) / 60000)}分`;
  if (state === "overdue")
    return `予定終了から${Math.floor((now.getTime() - new Date(reservation.ends_at).getTime()) / 60000)}分超過・退店未処理`;
  return null;
}
