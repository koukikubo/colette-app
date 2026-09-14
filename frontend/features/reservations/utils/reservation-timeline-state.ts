export type ReservationTimelineState =
  | "upcoming"
  | "in_progress"
  | "overdue"
  | "completed"
  | "canceled";

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