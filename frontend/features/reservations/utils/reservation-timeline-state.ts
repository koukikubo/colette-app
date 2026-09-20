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

  const currentEndsAt = new Date(currentReservation.ends_at).getTime();

  const nextReservation = reservations
    .filter((reservation) => {
      if (reservation.id === currentReservation.id) {
        return false;
      }

      if (
        reservation.completed_at !== null ||
        reservation.canceled_at !== null
      ) {
        return false;
      }

      return new Date(reservation.starts_at).getTime() >= currentEndsAt;
    })
    .sort(
      (firstReservation, secondReservation) =>
        new Date(firstReservation.starts_at).getTime() -
        new Date(secondReservation.starts_at).getTime(),
    )[0];

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
