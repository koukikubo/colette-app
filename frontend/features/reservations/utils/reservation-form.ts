import { ReservationCreateAttributes } from "../type";

type BuildNewReservationFormValuesParams = {
  targetDate: string;
};

export function buildNewReservationFormValues({}: BuildNewReservationFormValuesParams): ReservationCreateAttributes {
  return {
    customer_id: null,
    reservation_name: "",
    reservation_phone_number: "",

    starts_at: "18:00",
    ends_at: "20:00",

    guest_count: 2,

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
}
