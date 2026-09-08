import { describe, expect, it } from "vitest";

import type { ReservationFormValues } from "../../types";
import { validateReservationDateTimes } from "../../utils/reservation-form-validation";

const validValues: ReservationFormValues = {
  customer_id: 1,
  reservation_name: "山田 太郎",
  reservation_phone_number: "09012345678",
  starts_at: "2026-09-08T18:00",
  ends_at: "2026-09-08T20:00",
  guest_count: 2,
  reservation_status_id: 1,
  requested_restaurant_master_type_id: null,
  restaurant_master_ids: [],
  reservation_route_id: null,
  menu_type_id: null,
  occasion_id: null,
  allergy_note: "",
  disliked_food_note: "",
  preferred_food_note: "",
  favorite_drink_note: "",
  request_note: "",
  internal_memo: "",
};

describe("validateReservationDateTimes", () => {
  it("開始日時と終了日時が未入力なら、それぞれのエラーを返す", () => {
    const errors = validateReservationDateTimes({
      ...validValues,
      starts_at: "",
      ends_at: "",
    });

    expect(errors).toEqual({
      starts_at: ["予約開始日時を入力してください"],
      ends_at: ["予約終了日時を入力してください"],
    });
  });

  it("終了日時が開始日時と同じなら、終了日時のエラーを返す", () => {
    const errors = validateReservationDateTimes({
      ...validValues,
      starts_at: "2026-09-08T18:00",
      ends_at: "2026-09-08T18:00",
    });

    expect(errors).toEqual({
      ends_at: ["予約終了日時は予約開始日時より後に指定してください"],
    });
  });

  it("終了日時が開始日時より前なら、終了日時のエラーを返す", () => {
    const errors = validateReservationDateTimes({
      ...validValues,
      starts_at: "2026-09-08T18:00",
      ends_at: "2026-09-08T17:59",
    });

    expect(errors).toEqual({
      ends_at: ["予約終了日時は予約開始日時より後に指定してください"],
    });
  });

  it("終了日時が開始日時より後なら、エラーを返さない", () => {
    const errors = validateReservationDateTimes(validValues);

    expect(errors).toEqual({});
  });
});
