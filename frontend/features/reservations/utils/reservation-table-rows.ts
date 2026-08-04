import type {
  ReservationTableRow,
  RestaurantMaster,
} from "@/features/restaurant-masters/types";
import { Reservation } from "../types";

// 有効な席マスタごとに、割り当て済み予約をまとめる。
// 予約が存在しない席もタイムラインに表示する必要があるため、
// 予約配列ではなく席マスタ一覧を起点にして行を生成する。
export function buildReservationTableRows(
  restaurantMasters: RestaurantMaster[],
  reservations: Reservation[],
): ReservationTableRow[] {
  return restaurantMasters
    .filter((restaurantMaster) => restaurantMaster.active)
    .sort(compareRestaurantMasters)
    .map((restaurantMaster) => ({
      restaurantMaster,
      reservations: reservations.filter((reservation) =>
        reservation.restaurant_master_ids.includes(restaurantMaster.id),
      ),
    }));
}

// 席種、連番、IDの順で安定して表示する。
// sequence_numberが同じ場合でも並び順が変わらないように、
// 最後にidを比較している。

function compareRestaurantMasters(
  left: RestaurantMaster,
  right: RestaurantMaster,
): number {
  const typeComparison =
    left.restaurant_master_type_id - right.restaurant_master_type_id;

  if (typeComparison !== 0) {
    return typeComparison;
  }

  const sequenceComparison = left.sequence_number - right.sequence_number;

  if (sequenceComparison !== 0) {
    return sequenceComparison;
  }

  return left.id - right.id;
}

// 実テーブルがまだ割り当てられていない予約を取得する。
// 希望席種だけ決まっていて実席が未確定の予約を、タイムラインの「席未割当」行へ表示するために使用する。
export function findUnassignedReservations(
  reservations: Reservation[],
): Reservation[] {
  return reservations.filter(
    (reservation) => reservation.restaurant_master_ids.length === 0,
  );
}
