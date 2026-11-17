import type { ReservationFormValues } from "../types";
export type ReservationField = keyof ReservationFormValues;
export const reservationFieldLabels: Record<ReservationField, string> = {
  customer_id: "顧客",
  reservation_name: "予約者名",
  reservation_phone_number: "電話番号",
  starts_at: "開始日時",
  ends_at: "終了日時",
  guest_count: "人数",
  reservation_status_id: "予約状況",
  requested_restaurant_master_type_id: "希望席種",
  restaurant_master_ids: "割当席",
  reservation_route_id: "予約経路",
  menu_type_id: "メニュー",
  occasion_id: "利用目的",
  allergy_note: "アレルギー",
  disliked_food_note: "苦手な食材",
  preferred_food_note: "好みの食材",
  favorite_drink_note: "好みの飲み物",
  request_note: "要望",
  internal_memo: "店舗メモ",
};
const same = (a: unknown, b: unknown) =>
  JSON.stringify(Array.isArray(a) ? [...a].sort() : a) ===
  JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
export function conflictingFields(
  base: ReservationFormValues,
  mine: ReservationFormValues,
  latest: ReservationFormValues,
) {
  return (Object.keys(base) as ReservationField[]).filter(
    (key) =>
      !same(base[key], mine[key]) &&
      !same(base[key], latest[key]) &&
      !same(mine[key], latest[key]),
  );
}
// 相手だけの変更は必ず引き継ぐ。双方が違う値に変えた項目は明示選択なしに上書きしない。
export function mergeReservation(
  base: ReservationFormValues,
  mine: ReservationFormValues,
  latest: ReservationFormValues,
  choices: Partial<Record<ReservationField, "mine" | "latest">>,
) {
  if (conflictingFields(base, mine, latest).some((key) => !choices[key]))
    throw new Error("競合項目を選択してください");
  return Object.fromEntries(
    (Object.keys(base) as ReservationField[]).map((key) => [
      key,
      choices[key] === "latest"
        ? latest[key]
        : choices[key] === "mine" || !same(base[key], mine[key])
          ? mine[key]
          : latest[key],
    ]),
  ) as ReservationFormValues;
}
