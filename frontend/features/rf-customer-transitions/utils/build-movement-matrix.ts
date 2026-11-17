/**
 * RFランクの移動集計を、マトリクス表示用のデータへ変換する。
 *
 * APIから受け取った開始状態→終了状態の移動人数を、
 * 行・列・セル・行合計・列合計に整理する。
 *
 * ランクの上昇・下降・維持は再判定せず、APIの判定結果を使用する。
 * Reactや画面表示には依存せず、集計処理を単独でテストできるようにする。
 */

import type {
  RfCustomerTransition,
  RfMovementCategory,
  RfMovementState,
  RfTransitionRank,
} from "../types/customer-transition";

export type MatrixAxis = {
  key: string;
  state: RfMovementState;
  rank: RfTransitionRank | null;
  label: string;
};

export type MatrixCell = {
  count: number;
  categories: RfMovementCategory[];
};

const stateLabels: Record<RfMovementState, string> = {
  ranked: "ランクあり",
  no_visit: "来店履歴なし",
  unmatched: "未分類",
  excluded: "計算対象外",
  missing: "記録なし",
};

const stateOrder: Record<RfMovementState, number> = {
  ranked: 0,
  no_visit: 1,
  unmatched: 2,
  excluded: 3,
  missing: 4,
};

function makeAxis(
  state: RfMovementState,
  rank: RfTransitionRank | null,
): MatrixAxis {
  return {
    key: `${state}:${rank?.id ?? "none"}`,
    state,
    rank,
    label: state === "ranked" && rank ? rank.label : stateLabels[state],
  };
}

export function matrixCellKey(from: string, to: string) {
  return `${from}|${to}`;
}

function sortAxes(axes: MatrixAxis[]) {
  return axes.sort(
    (a, b) =>
      stateOrder[a.state] - stateOrder[b.state] ||
      (a.rank?.position ?? 0) - (b.rank?.position ?? 0) ||
      (a.rank?.id ?? 0) - (b.rank?.id ?? 0),
  );
}

/**
 * 移動結果から、表示する両軸と各セル・合計人数を構築する。
 *
 * @param transitions APIが返した開始状態→終了状態ごとの移動集計
 * @returns 行・列の定義、セルの人数と区分、行合計・列合計・総人数
 *
 * 片側にしか存在しないランクも両軸に含める。
 * 両時点とも移動結果に登場しないランクは、このデータだけでは追加できない。
 */
export function buildMovementMatrix(transitions: RfCustomerTransition[]) {
  const fromAxes = new Map<string, MatrixAxis>();
  const toAxes = new Map<string, MatrixAxis>();
  const cells = new Map<string, MatrixCell>();
  const rowTotals = new Map<string, number>();
  const columnTotals = new Map<string, number>();
  let total = 0;

  for (const transition of transitions) {
    const from = makeAxis(transition.from_state, transition.from_rank);
    const to = makeAxis(transition.to_state, transition.to_rank);

    fromAxes.set(from.key, from);
    toAxes.set(to.key, to);

    const key = matrixCellKey(from.key, to.key);
    const cell = cells.get(key) ?? {
      count: 0,
      categories: [],
    };

    cell.count += transition.count;

    if (!cell.categories.includes(transition.category)) {
      cell.categories.push(transition.category);
    }

    cells.set(key, cell);
    rowTotals.set(from.key, (rowTotals.get(from.key) ?? 0) + transition.count);
    columnTotals.set(
      to.key,
      (columnTotals.get(to.key) ?? 0) + transition.count,
    );
    total += transition.count;
  }

  // 両軸の順序を揃える。片側にしか存在しないランクも残す。
  const allKeys = new Set([...fromAxes.keys(), ...toAxes.keys()]);

  const rows = sortAxes(
    [...allKeys].map((key) => fromAxes.get(key) ?? toAxes.get(key)!),
  );
  const columns = sortAxes(
    [...allKeys].map((key) => toAxes.get(key) ?? fromAxes.get(key)!),
  );

  return { rows, columns, cells, rowTotals, columnTotals, total };
}

/**
 * 開始時点の同じランク・状態を分母に、移動先の割合を算出する。
 *
 * @returns 0〜100の百分率。分母が0の場合は0。
 * 表示桁数の丸めは、表示側で行う。
 */
export function rowPercentage(count: number, total: number) {
  return total === 0 ? 0 : (count / total) * 100;
}
