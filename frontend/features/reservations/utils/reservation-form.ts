import type {
  ReservationAttributes,
  ReservationCreateRequest,
  ReservationFormValues,
} from "../types";

type BuildNewReservationFormValuesParams = {
  targetDate: string;
};

export function buildNewReservationFormValues({
  targetDate,
}: BuildNewReservationFormValuesParams): ReservationFormValues {
  return {
    customer_id: null,
    reservation_name: "",
    reservation_phone_number: "",

    starts_at: `${targetDate}T18:00`,
    ends_at: `${targetDate}T20:00`,
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

function nullableValue(value: string): string | null {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

function toReservationAttributes(
  values: ReservationFormValues,
): ReservationAttributes {
  if (values.requested_restaurant_master_type_id === null) {
    throw new Error("希望席種を選択してください。");
  }

  return {
    customer_id: values.customer_id,
    reservation_name: values.reservation_name.trim(),
    reservation_phone_number:
      values.reservation_phone_number.trim(),

    starts_at: values.starts_at,
    ends_at: values.ends_at,
    guest_count: values.guest_count,

    requested_restaurant_master_type_id:
      values.requested_restaurant_master_type_id,

    restaurant_master_ids: [
      ...values.restaurant_master_ids,
    ],

    reservation_route_id: values.reservation_route_id,
    menu_type_id: values.menu_type_id,
    occasion_id: values.occasion_id,

    allergy_note: nullableValue(values.allergy_note),
    disliked_food_note:
      nullableValue(values.disliked_food_note),
    preferred_food_note:
      nullableValue(values.preferred_food_note),
    favorite_drink_note:
      nullableValue(values.favorite_drink_note),
    request_note: nullableValue(values.request_note),
    internal_memo: nullableValue(values.internal_memo),
  };
}

export function buildCreateReservationRequest(
  values: ReservationFormValues,
): ReservationCreateRequest {
  return {
    reservation: toReservationAttributes(values),
  };
}