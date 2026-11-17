import type {
  Reservation,
  ReservationAttributes,
  ReservationCreateRequest,
  ReservationFormValues,
  ReservationUpdateRequest,
} from "../types";

import { formatReservationDateTimeLocal } from "./reservation-date";

type BuildNewReservationFormValuesParams = {
  targetDate: string;
  startTime?: string;
  restaurantMasterId?: number;
};

// 新規予約フォームを開いた直後の入力値を、対象日から作成する。
export function buildNewReservationFormValues({
  targetDate,
  startTime,
  restaurantMasterId,
}: BuildNewReservationFormValuesParams): ReservationFormValues {
  const validTime =
    startTime && /^(17|18|19|20):[0-5]\d$|^21:00$/.test(startTime)
      ? startTime
      : "17:00";
  const [hour, minute] = validTime.split(":").map(Number);
  const endMinutes = Math.min(24 * 60, hour * 60 + minute + 120);
  const endDate =
    endMinutes === 24 * 60 ? new Date(`${targetDate}T00:00:00Z`) : null;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() + 1);
  const endsAt = endDate
    ? `${endDate.toISOString().slice(0, 10)}T00:00`
    : `${targetDate}T${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  return {
    customer_id: null,
    reservation_name: "",
    reservation_phone_number: "",
    reservation_status_id: null,
    starts_at: `${targetDate}T${validTime}`,
    ends_at: endsAt,
    guest_count: 2,

    requested_restaurant_master_type_id: null,
    restaurant_master_ids:
      restaurantMasterId &&
      Number.isSafeInteger(restaurantMasterId) &&
      restaurantMasterId > 0
        ? [restaurantMasterId]
        : [],

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

// APIから取得した予約を編集フォームで扱える入力値へ変換する。
export function buildEditReservationFormValues(
  reservation: Reservation,
): ReservationFormValues {
  return {
    customer_id: reservation.customer_id,
    reservation_name: reservation.reservation_name,
    reservation_phone_number: reservation.reservation_phone_number,

    starts_at: formatReservationDateTimeLocal(reservation.starts_at),
    ends_at: formatReservationDateTimeLocal(reservation.ends_at),
    guest_count: reservation.guest_count,

    requested_restaurant_master_type_id:
      reservation.requested_restaurant_master_type_id,
    restaurant_master_ids: [...reservation.restaurant_master_ids],

    reservation_status_id: reservation.reservation_status_id,
    reservation_route_id: reservation.reservation_route_id,
    menu_type_id: reservation.menu_type_id,
    occasion_id: reservation.occasion_id,

    allergy_note: reservation.allergy_note ?? "",
    disliked_food_note: reservation.disliked_food_note ?? "",
    preferred_food_note: reservation.preferred_food_note ?? "",
    favorite_drink_note: reservation.favorite_drink_note ?? "",
    request_note: reservation.request_note ?? "",
    internal_memo: reservation.internal_memo ?? "",
  };
}

// textareaなどの文字列を整形し、空欄ならRailsへnullとして送る。
function nullableValue(value: string): string | null {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

// フォーム入力値をRailsへ送信できる予約属性へ変換する。
// 送信前に必須項目を確認し、文字列の整形・空欄のnull変換を行う。
function toReservationAttributes(
  values: ReservationFormValues,
): ReservationAttributes {
  return {
    customer_id: values.customer_id,
    reservation_name: values.reservation_name.trim(),
    reservation_phone_number: values.reservation_phone_number.trim(),
    reservation_status_id: values.reservation_status_id,
    starts_at: values.starts_at,
    ends_at: values.ends_at,
    guest_count: values.guest_count,

    requested_restaurant_master_type_id:
      values.requested_restaurant_master_type_id,
    restaurant_master_ids: [...values.restaurant_master_ids],

    reservation_route_id: values.reservation_route_id,
    menu_type_id: values.menu_type_id,
    occasion_id: values.occasion_id,

    allergy_note: nullableValue(values.allergy_note),
    disliked_food_note: nullableValue(values.disliked_food_note),
    preferred_food_note: nullableValue(values.preferred_food_note),
    favorite_drink_note: nullableValue(values.favorite_drink_note),
    request_note: nullableValue(values.request_note),
    internal_memo: nullableValue(values.internal_memo),
  };
}

// Railsの予約登録APIが受け取る { reservation: { ... } } 形式のリクエストを作成する。
export function buildCreateReservationRequest(
  values: ReservationFormValues,
): ReservationCreateRequest {
  return {
    reservation: toReservationAttributes(values),
  };
}

// Railsの予約更新APIへ送る入力値と楽観ロック番号をまとめる。
export function buildUpdateReservationRequest(
  values: ReservationFormValues,
  lockVersion: number,
): ReservationUpdateRequest {
  return {
    reservation: {
      ...toReservationAttributes(values),
      lock_version: lockVersion,
    },
  };
}
