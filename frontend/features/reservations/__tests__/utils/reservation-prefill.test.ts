import { expect, it } from "vitest";
import { buildNewReservationFormValues } from "../../utils/reservation-form";
it("空き枠の開始時間と席を初期入力し終了を2時間後にする", () => {
  expect(
    buildNewReservationFormValues({
      targetDate: "2026-11-15",
      startTime: "20:45",
      restaurantMasterId: 3,
    }),
  ).toMatchObject({
    starts_at: "2026-11-15T20:45",
    ends_at: "2026-11-15T22:45",
    restaurant_master_ids: [3],
  });
});
it("不正な時刻・席IDは既定値へ戻す", () => {
  expect(
    buildNewReservationFormValues({
      targetDate: "2026-11-15",
      startTime: "25:99",
      restaurantMasterId: NaN,
    }),
  ).toMatchObject({ starts_at: "2026-11-15T17:00", restaurant_master_ids: [] });
});
