/**
 * マトリクスの人数・行合計・列合計・割合の整合性を検証する。
 *
 * APIの移動区分を維持しながら、同じ移動先への人数を合算できること、
 * 対象外や片側だけの記録を通常ランクと分けられることを確認する。
 */
import { describe, expect, it } from "vitest";

import type {
  RfCustomerTransition,
  RfTransitionRank,
} from "../../types/customer-transition";
import {
  buildMovementMatrix,
  matrixCellKey,
  rowPercentage,
} from "../../utils/build-movement-matrix";

const rankA: RfTransitionRank = {
  id: 1,
  label: "Aランク",
  display_code: "00001",
  display_color: "#059669",
  position: 1,
};

const rankB: RfTransitionRank = {
  ...rankA,
  id: 2,
  label: "Bランク",
  display_code: "00002",
  position: 2,
};

/**
 * 通常ランクの移動データを作る。
 * 個々のテストでは、検証したい差分だけを上書きする。
 */
function movement(
  overrides: Partial<RfCustomerTransition> = {},
): RfCustomerTransition {
  return {
    category: "up",
    from_state: "ranked",
    from_rank: rankB,
    to_state: "ranked",
    to_rank: rankA,
    count: 3,
    ...overrides,
  };
}

describe("buildMovementMatrix", () => {
  it("同じ移動の人数を合算し、行・列・全体の合計を一致させる", () => {
    const matrix = buildMovementMatrix([
      movement({ count: 3 }),
      movement({ count: 2 }),
      movement({
        category: "unchanged",
        to_rank: rankB,
        count: 5,
      }),
    ]);

    const fromB = "ranked:2";
    const toA = "ranked:1";
    const toB = "ranked:2";

    expect(matrix.cells.get(matrixCellKey(fromB, toA))).toEqual({
      count: 5,
      categories: ["up"],
    });

    expect(matrix.rowTotals.get(fromB)).toBe(10);
    expect(matrix.columnTotals.get(toA)).toBe(5);
    expect(matrix.columnTotals.get(toB)).toBe(5);
    expect(matrix.total).toBe(10);

    expect(
      [...matrix.rowTotals.values()].reduce((sum, count) => sum + count, 0),
    ).toBe(matrix.total);

    expect(
      [...matrix.columnTotals.values()].reduce((sum, count) => sum + count, 0),
    ).toBe(matrix.total);
  });

  it("片側にしか登場しないランクも両軸に残す", () => {
    const matrix = buildMovementMatrix([movement()]);

    expect(matrix.rows.map((axis) => axis.key)).toEqual([
      "ranked:1",
      "ranked:2",
    ]);
    expect(matrix.columns.map((axis) => axis.key)).toEqual([
      "ranked:1",
      "ranked:2",
    ]);
  });

  it("対象外と記録なしを通常ランクから分ける", () => {
    const matrix = buildMovementMatrix([
      movement({
        category: "excluded",
        to_state: "excluded",
        to_rank: null,
        count: 2,
      }),
      movement({
        category: "added",
        from_state: "missing",
        from_rank: null,
        count: 4,
      }),
    ]);

    expect(matrix.rowTotals.get("ranked:2")).toBe(2);
    expect(matrix.rowTotals.get("missing:none")).toBe(4);
    expect(matrix.columnTotals.get("excluded:none")).toBe(2);
    expect(matrix.columnTotals.get("ranked:1")).toBe(4);
    expect(matrix.total).toBe(6);
  });

  it("APIの区分を再判定せず保持する", () => {
    // 画面側が順位を見て独自に昇降を再判定しないことを確認する。
    const matrix = buildMovementMatrix([
      movement({ category: "same_position" }),
    ]);

    expect(
      matrix.cells.get(matrixCellKey("ranked:2", "ranked:1"))?.categories,
    ).toEqual(["same_position"]);
  });

  it("空の移動結果では空の表データを返す", () => {
    const matrix = buildMovementMatrix([]);

    expect(matrix.rows).toEqual([]);
    expect(matrix.columns).toEqual([]);
    expect(matrix.cells.size).toBe(0);
    expect(matrix.total).toBe(0);
  });
});

describe("rowPercentage", () => {
  it("開始区分の人数を分母に百分率を返す", () => {
    expect(rowPercentage(3, 12)).toBe(25);
  });

  it("分母が0でもNaNやInfinityにならない", () => {
    expect(rowPercentage(0, 0)).toBe(0);
  });
});
