import { describe, expect, it } from "vitest";

import type { ReservationFormValues } from "../../types";
import { buildCreateReservationRequest } from "../../utils/reservation-form";

describe("buildCreateReservationRequest", () => {
  it("入力値を整形して、予約作成 API 用のデータへ変換する", () => {
    const values: ReservationFormValues = {
      customer_id: 1,
      reservation_name: " 山田 太郎 ",
      reservation_phone_number: " 09012345678 ",
      starts_at: "2026-09-08T18:00",
      ends_at: "2026-09-08T20:00",
      guest_count: 2,
      reservation_status_id: 1,
      requested_restaurant_master_type_id: 2,
      restaurant_master_ids: [10, 11],
      reservation_route_id: 3,
      menu_type_id: 4,
      occasion_id: 5,
      allergy_note: " えび ",
      disliked_food_note: "   ",
      preferred_food_note: "",
      favorite_drink_note: " 日本酒 ",
      request_note: " 窓側の席を希望 ",
      internal_memo: " 受付確認済み ",
    };

    const request = buildCreateReservationRequest(values);

    expect(request).toEqual({
      reservation: {
        customer_id: 1,
        reservation_name: "山田 太郎",
        reservation_phone_number: "09012345678",
        starts_at: "2026-09-08T18:00",
        ends_at: "2026-09-08T20:00",
        guest_count: 2,
        reservation_status_id: 1,
        requested_restaurant_master_type_id: 2,
        restaurant_master_ids: [10, 11],
        reservation_route_id: 3,
        menu_type_id: 4,
        occasion_id: 5,
        allergy_note: "えび",
        disliked_food_note: null,
        preferred_food_note: null,
        favorite_drink_note: "日本酒",
        request_note: "窓側の席を希望",
        internal_memo: "受付確認済み",
      },
    });
  });
});
