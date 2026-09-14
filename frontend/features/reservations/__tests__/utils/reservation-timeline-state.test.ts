import { describe, expect, it } from "vitest";

import { getReservationTimelineState } from "../../utils/reservation-timeline-state";

const baseReservation = {
  starts_at: "2026-09-14T18:00:00+09:00",
  ends_at: "2026-09-14T20:00:00+09:00",
  completed_at: null,
  canceled_at: null,
};

describe("getReservationTimelineState", () => {
  it("開始時刻前はupcomingを返す", () => {
    const state = getReservationTimelineState(
      baseReservation,
      new Date("2026-09-14T17:59:00+09:00"),
    );

    expect(state).toBe("upcoming");
  });

  it("開始時刻になるとin_progressを返す", () => {
    const state = getReservationTimelineState(
      baseReservation,
      new Date("2026-09-14T18:00:00+09:00"),
    );

    expect(state).toBe("in_progress");
  });

  it("予約時間内はin_progressを返す", () => {
    const state = getReservationTimelineState(
      baseReservation,
      new Date("2026-09-14T19:00:00+09:00"),
    );

    expect(state).toBe("in_progress");
  });

  it("終了予定時刻になるとoverdueを返す", () => {
    const state = getReservationTimelineState(
      baseReservation,
      new Date("2026-09-14T20:00:00+09:00"),
    );

    expect(state).toBe("overdue");
  });

  it("completed_atがあればcompletedを返す", () => {
    const state = getReservationTimelineState(
      {
        ...baseReservation,
        completed_at: "2026-09-14T19:30:00+09:00",
      },
      new Date("2026-09-14T21:00:00+09:00"),
    );

    expect(state).toBe("completed");
  });

  it("canceled_atがあればcanceledを返す", () => {
    const state = getReservationTimelineState(
      {
        ...baseReservation,
        canceled_at: "2026-09-14T17:30:00+09:00",
      },
      new Date("2026-09-14T19:00:00+09:00"),
    );

    expect(state).toBe("canceled");
  });
});
