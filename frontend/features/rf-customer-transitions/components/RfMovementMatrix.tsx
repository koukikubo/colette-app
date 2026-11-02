/**
 * RFランクの2時点間の移動を、操作可能なマトリクスで表示する。
 *
 * 行は開始時点、列は終了時点を表し、
 * 各セルに人数・開始区分に占める割合・移動区分を表示する。
 *
 * 集計はbuildMovementMatrixへ委譲し、
 * このファイルでは表の描画、配色、セル選択、説明表示を担当する。
 * API通信や顧客ランクの更新は行わない。
 */
"use client";

import { useState } from "react";

import type {
  RfCustomerTransition,
  RfMovementCategory,
} from "../types/customer-transition";
import {
  buildMovementMatrix,
  matrixCellKey,
  rowPercentage,
} from "../utils/build-movement-matrix";
import { RfHelpHint } from "./RfHelpHint";

const categoryLabels: Record<RfMovementCategory, string> = {
  up: "↑ 上昇",
  down: "↓ 下降",
  unchanged: "＝ 維持",
  same_position: "同順位の別ランク",
  added: "終了時点のみ",
  removed: "開始時点のみ",
  excluded: "対象外を含む",
  unmatched: "未分類を含む",
  no_visit: "来店履歴なしを含む",
};

/**
 * APIの移動区分に対応する背景色・文字色を返す。
 *
 * 表の上下左右の位置から昇降を推測しない。
 * 来店履歴なし・対象外などは、通常の上昇・下降と異なる配色にする。
 */
function cellTone(category?: RfMovementCategory) {
  switch (category) {
    case "up":
      return "bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100";
    case "down":
      return "bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
    case "unchanged":
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
    default:
      return "bg-muted/30 text-foreground";
  }
}

type Props = {
  transitions: RfCustomerTransition[];
};

/**
 * 移動マトリクスと、選択したセルの説明を表示する。
 *
 * @param transitions 比較APIが返したランク間の移動集計
 *
 * 選択状態はこのコンポーネント内で保持する。
 * 比較対象が変わる際は、親が計算IDを使ったkeyを変更して選択をリセットする。
 */
export function RfMovementMatrix({ transitions }: Props) {
  const matrix = buildMovementMatrix(transitions);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  let selectedDescription = "";

  for (const row of matrix.rows) {
    for (const column of matrix.columns) {
      const key = matrixCellKey(row.key, column.key);
      if (key !== selectedKey) continue;

      const count = matrix.cells.get(key)?.count ?? 0;
      const total = matrix.rowTotals.get(row.key) ?? 0;

      selectedDescription =
        `開始時点の「${row.label}」${total.toLocaleString("ja-JP")}人のうち、` +
        `${count.toLocaleString("ja-JP")}人が終了時点の「${column.label}」に該当します。` +
        `開始時点の同区分に占める割合は${rowPercentage(count, total).toFixed(1)}%です。`;
    }
  }

  if (matrix.total === 0) {
    return <p>比較対象の顧客がいません。</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">ランク移動マトリクス</h3>

          <RfHelpHint label="マトリクスの読み方">
            <p>行は開始時点、列は終了時点のランク・状態です。</p>
            <p>
              人数の下の割合は、開始時点の同じランク・状態の人数を
              100%として算出しています。
            </p>
            <p>
              「記録なし」は、その時点の計算結果に
              顧客の記録がないことを示します。
            </p>
          </RfHelpHint>
        </div>

        <div className="flex gap-3 text-xs">
          <span className="rounded bg-teal-50 px-2 py-1 text-teal-900">
            ↑ 上昇
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-900">
            ＝ 維持
          </span>
          <span className="rounded bg-orange-50 px-2 py-1 text-orange-900">
            ↓ 下降
          </span>
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-xl border"
        role="region"
        aria-label="RFランク移動表・横スクロール可能"
        tabIndex={0}
      >
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            開始月から終了月へのRFランク移動
          </caption>

          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-36 border-b bg-background p-4 text-left"
              >
                開始 ↓ ／ 終了 →
              </th>

              {matrix.columns.map((column) => (
                <th
                  scope="col"
                  key={column.key}
                  className="min-w-32 border-b bg-muted/40 p-3 text-center"
                >
                  {column.label}
                </th>
              ))}

              <th scope="col" className="min-w-24 border-b p-3">
                開始時点の合計
              </th>
            </tr>
          </thead>

          <tbody>
            {matrix.rows.map((row) => {
              const total = matrix.rowTotals.get(row.key) ?? 0;

              return (
                <tr key={row.key}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b bg-background p-4 text-left"
                  >
                    {row.label}
                  </th>

                  {matrix.columns.map((column) => {
                    const key = matrixCellKey(row.key, column.key);
                    const cell = matrix.cells.get(key);
                    const count = cell?.count ?? 0;
                    const percentage = rowPercentage(count, total);
                    const category =
                      cell?.categories.length === 1
                        ? cell.categories[0]
                        : undefined;
                    const label = category
                      ? categoryLabels[category]
                      : "複数区分";

                    return (
                      <td key={column.key} className="border-b p-1">
                        {count === 0 ? (
                          <span className="block p-4 text-center text-muted-foreground/50">
                            0
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-pressed={selectedKey === key}
                            aria-label={`${row.label}から${column.label}へ、${count}人、${label}、開始区分の${percentage.toFixed(1)}%`}
                            onClick={() => setSelectedKey(key)}
                            className={[
                              "w-full rounded-lg p-3 text-center transition",
                              "hover:ring-2 hover:ring-ring/40",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selectedKey === key ? "ring-2 ring-ring" : "",
                              cellTone(category),
                            ].join(" ")}
                          >
                            <span className="block text-lg font-semibold tabular-nums">
                              {count.toLocaleString("ja-JP")}
                              <span className="ml-1 text-xs font-normal">
                                人
                              </span>
                            </span>
                            <span className="block text-xs">
                              {percentage.toFixed(1)}%
                            </span>
                            <span className="mt-1 block text-xs">{label}</span>
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td className="border-b p-3 text-center font-semibold tabular-nums">
                    {total.toLocaleString("ja-JP")}人
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-muted/30 font-semibold">
              <th
                scope="row"
                className="sticky left-0 bg-background p-4 text-left"
              >
                終了時点の合計
              </th>
              {matrix.columns.map((column) => (
                <td key={column.key} className="p-3 text-center tabular-nums">
                  {(matrix.columnTotals.get(column.key) ?? 0).toLocaleString(
                    "ja-JP",
                  )}
                  人
                </td>
              ))}
              <td className="p-3 text-center tabular-nums">
                {matrix.total.toLocaleString("ja-JP")}人
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        セルの割合は各行の合計を100%としています。「記録なし」は、その時点の計算結果に顧客の記録がないことを示します。
      </p>

      <div role="status" className="rounded-lg border bg-muted/20 p-4 text-sm">
        {selectedDescription ||
          "人数のあるセルを選択すると、移動の内容を確認できます。"}
      </div>
    </div>
  );
}
