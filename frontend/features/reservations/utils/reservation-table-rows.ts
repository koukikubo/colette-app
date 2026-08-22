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

// 実テーブルがまだ割り当てられていない予約を開始時刻順で取得する。
// 予約一覧上部の「要対応」一覧へ表示し、早い予約から確認できるようにする。
export function findUnassignedReservations(
  reservations: Reservation[],
): Reservation[] {
  return reservations
    .filter((reservation) => reservation.restaurant_master_ids.length === 0)
    .sort((firstReservation, secondReservation) => {
      const startsAtDifference =
        new Date(firstReservation.starts_at).getTime() -
        new Date(secondReservation.starts_at).getTime();

      // 開始時刻が同じ場合も、予約ID順にして表示順を安定させる。
      if (startsAtDifference === 0) {
        return firstReservation.id - secondReservation.id;
      }

      return startsAtDifference;
    });
}
