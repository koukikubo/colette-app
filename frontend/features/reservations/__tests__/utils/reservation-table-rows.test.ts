import { describe, expect, it } from "vitest";

import type { RestaurantMaster } from "@/features/restaurant-masters/types";
import { createReservation } from "../fixtures/reservation-fixtures";
import {
  buildReservationTableRows,
  findUnassignedReservations,
} from "../../utils/reservation-table-rows";

function createTable(overrides: Partial<RestaurantMaster>): RestaurantMaster {
  return {
    id: 1,
    restaurant_master_type_id: 1,
    restaurant_master_type: { id: 1, code: "counter", label: "カウンター" },
    sequence_number: 1,
    code: "C01",
    name: "カウンター1",
    capacity: 1,
    active: true,
    memo: null,
    lock_version: 0,
    created_by_staff: null,
    updated_by_staff: null,
    created_at: "2026-09-01T00:00:00+09:00",
    updated_at: "2026-09-01T00:00:00+09:00",
    ...overrides,
  };
}

describe("reservation-table-rows", () => {
  it("有効な席だけを席種・表示順・ID順に並べ、予約を割り当てる", () => {
    const tables = [
      createTable({ id: 3, sequence_number: 1 }),
      createTable({ id: 2, sequence_number: 1 }),
      createTable({ id: 4, active: false }),
      createTable({ id: 1, restaurant_master_type_id: 2 }),
    ];
    const reservation = createReservation({ restaurant_master_ids: [2, 3] });

    const rows = buildReservationTableRows(tables, [reservation]);

    expect(rows.map((row) => row.restaurantMaster.id)).toEqual([2, 3, 1]);
    expect(rows[0]?.reservations).toEqual([reservation]);
    expect(rows[2]?.reservations).toEqual([]);
  });

  it("未割当予約を開始時刻順、同時刻ならID順に並べる", () => {
    const reservations = [
      createReservation({ id: 3, starts_at: "2026-09-08T19:00:00+09:00" }),
      createReservation({ id: 2, starts_at: "2026-09-08T18:00:00+09:00" }),
      createReservation({ id: 1, starts_at: "2026-09-08T18:00:00+09:00" }),
      createReservation({ id: 4, restaurant_master_ids: [1] }),
    ];

    expect(
      findUnassignedReservations(reservations).map(({ id }) => id),
    ).toEqual([1, 2, 3]);
  });
});
