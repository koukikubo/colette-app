import { describe, expect, it } from "vitest";

import {
  getReservationTimelineState,
  getReservationProgressPercentage,
  findNextReservationWarning,
} from "../../utils/reservation-timeline-state";

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

  describe("getReservationProgressPercentage", () => {
    it("開始前は0を返す", () => {
      const progress = getReservationProgressPercentage(
        baseReservation,
        new Date("2026-09-14T17:30:00+09:00"),
      );

      expect(progress).toBe(0);
    });

    it("予約時間の半分が経過した場合は50を返す", () => {
      const progress = getReservationProgressPercentage(
        baseReservation,
        new Date("2026-09-14T19:00:00+09:00"),
      );

      expect(progress).toBe(50);
    });

    it("終了予定時刻以降は100を返す", () => {
      const progress = getReservationProgressPercentage(
        baseReservation,
        new Date("2026-09-14T20:30:00+09:00"),
      );

      expect(progress).toBe(100);
    });
  });

  describe("findNextReservationWarning", () => {
    const overdueReservation = {
      id: 1,
      starts_at: "2026-09-14T18:00:00+09:00",
      ends_at: "2026-09-14T20:00:00+09:00",
      completed_at: null,
      canceled_at: null,
    };

    it("次の予約が15分以内なら警告対象として返す", () => {
      const nextReservation = {
        id: 2,
        starts_at: "2026-09-14T20:10:00+09:00",
        ends_at: "2026-09-14T22:00:00+09:00",
        completed_at: null,
        canceled_at: null,
      };

      const warning = findNextReservationWarning(
        overdueReservation,
        [overdueReservation, nextReservation],
        new Date("2026-09-14T20:00:00+09:00"),
      );

      expect(warning).toEqual({
        nextReservationId: 2,
        minutesUntilNextReservation: 10,
      });
    });

    it("次の予約まで15分を超える場合はnullを返す", () => {
      const nextReservation = {
        id: 2,
        starts_at: "2026-09-14T20:30:00+09:00",
        ends_at: "2026-09-14T22:00:00+09:00",
        completed_at: null,
        canceled_at: null,
      };

      const warning = findNextReservationWarning(
        overdueReservation,
        [overdueReservation, nextReservation],
        new Date("2026-09-14T20:00:00+09:00"),
      );

      expect(warning).toBeNull();
    });

    it("現在の予約が対応完了済みならnullを返す", () => {
      const completedReservation = {
        ...overdueReservation,
        completed_at: "2026-09-14T19:50:00+09:00",
      };

      const nextReservation = {
        id: 2,
        starts_at: "2026-09-14T20:10:00+09:00",
        ends_at: "2026-09-14T22:00:00+09:00",
        completed_at: null,
        canceled_at: null,
      };

      const warning = findNextReservationWarning(
        completedReservation,
        [completedReservation, nextReservation],
        new Date("2026-09-14T20:00:00+09:00"),
      );

      expect(warning).toBeNull();
    });

    it("次の予約がキャンセル済みならnullを返す", () => {
      const canceledNextReservation = {
        id: 2,
        starts_at: "2026-09-14T20:10:00+09:00",
        ends_at: "2026-09-14T22:00:00+09:00",
        completed_at: null,
        canceled_at: "2026-09-14T19:00:00+09:00",
      };

      const warning = findNextReservationWarning(
        overdueReservation,
        [overdueReservation, canceledNextReservation],
        new Date("2026-09-14T20:00:00+09:00"),
      );

      expect(warning).toBeNull();
    });
  });
});
