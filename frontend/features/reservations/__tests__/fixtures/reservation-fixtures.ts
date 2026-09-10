import type { Reservation } from "../../types";

export function createReservation(
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: 1,
    customer_id: 1,
    reservation_name: "山田 太郎",
    customer: null,
    reservation_phone_number: "09012345678",

    starts_at: "2026-09-08T18:00:00+09:00",
    ends_at: "2026-09-08T20:00:00+09:00",
    guest_count: 2,

    requested_restaurant_master_type_id: 1,
    requested_restaurant_master_type: {
      id: 1,
      code: "table",
      label: "テーブル席",
    },

    restaurant_master_ids: [],
    restaurant_masters: [],

    reservation_status_id: 1,
    reservation_status: {
      id: 1,
      code: "confirmed",
      label: "予約確定",
    },

    reservation_route_id: null,
    reservation_route: null,
    menu_type_id: null,
    menu_type: null,
    occasion_id: null,
    occasion: null,

    allergy_note: null,
    disliked_food_note: null,
    preferred_food_note: null,
    favorite_drink_note: null,
    request_note: null,
    internal_memo: null,

    details_confirmed_at: null,
    canceled_at: null,
    lock_version: 0,

    created_by_staff: {
      id: 1,
      staff_master_id: 1,
      name: "店主",
    },
    updated_by_staff: {
      id: 1,
      staff_master_id: 1,
      name: "店主",
    },

    created_at: "2026-09-01T10:00:00+09:00",
    updated_at: "2026-09-01T10:00:00+09:00",

    ...overrides,
  };
}
