"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/api-client";
import { fetchRfMonthComparison } from "../api/customer-transition-api";
import type {
  RfMonthComparison,
  RfMovementCategory,
  RfMovementState,
  RfTransitionRank,
} from "../types/customer-transition";

const categories: Record<RfMovementCategory, string> = {
  up: "上昇",
  down: "下降",
  unchanged: "維持",
  same_position: "同順位の別ランク",
  added: "終了時点のみ",
  removed: "開始時点のみ",
  excluded: "対象外を含む",
  unmatched: "未分類を含む",
  no_visit: "来店履歴なしを含む",
};
const states: Record<RfMovementState, string> = {
  missing: "記録なし",
  excluded: "対象外",
  unmatched: "未分類",
  no_visit: "来店履歴なし",
  ranked: "ランクあり",
};
function rankLabel(rank: RfTransitionRank | null, state: RfMovementState) {
  return rank ? `${rank.label}（${rank.display_code}）` : states[state];
}

export function RfCustomerTransitionSection() {
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [comparison, setComparison] = useState<RfMonthComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  function changeMonth(value: string, side: "start" | "end") {
    pending.current?.abort();
    setIsLoading(false);
    setComparison(null);
    setErrorMessage(null);
    if (side === "start") setStartMonth(value);
    else setEndMonth(value);
  }

  async function compare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setComparison(null);
    setErrorMessage(null);
    if (startMonth > endMonth) {
      setErrorMessage("開始月は終了月以前を指定してください");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchRfMonthComparison(
        startMonth,
        endMonth,
        controller.signal,
      );
      if (!controller.signal.aborted) setComparison(response.data);
    } catch (error) {
      if (!controller.signal.aborted) {
        setErrorMessage(
          error instanceof ApiClientError
            ? [error.message, ...error.errorMessages].join(" / ")
            : "RFランク比較を取得できませんでした。再度比較してください。",
        );
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  return (
    <section aria-label="RFランクの2時点比較">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>開始月・終了月のランク移動</h2>
          </CardTitle>
          <CardDescription>
            各月の適用済み履歴のうち、最新の計算基準日の結果を比較します（月末時点の再計算ではありません）。
            途中の変動は数えず、同じ顧客の開始・終了ランクが同じなら維持です。
            履歴がない月やRFルールが異なる月同士は比較できません。現在適用中のランクは変更しません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={compare} className="flex flex-wrap items-end gap-4">
            <label className="grid gap-1">
              開始月
              <input
                className="rounded border p-2"
                type="month"
                required
                value={startMonth}
                onChange={(e) => changeMonth(e.target.value, "start")}
              />
            </label>
            <label className="grid gap-1">
              終了月
              <input
                className="rounded border p-2"
                type="month"
                required
                value={endMonth}
                onChange={(e) => changeMonth(e.target.value, "end")}
              />
            </label>
            <Button
              type="submit"
              disabled={isLoading || !startMonth || !endMonth}
            >
              比較する
            </Button>
          </form>
          {isLoading && <p role="status">RFランクを比較しています。</p>}
          {errorMessage && (
            <p role="alert" className="text-destructive">
              {errorMessage}
            </p>
          )}
          {comparison && (
            <div className="space-y-4">
              <p>
                比較月: {comparison.start_month} → {comparison.end_month}
                <br />
                実際の計算基準日: {comparison.start_run.base_date} →{" "}
                {comparison.end_run.base_date}
              </p>
              {comparison.provisional && (
                <p>
                  当月を含むため暫定結果です。今日までの適用済み計算を使用します。
                </p>
              )}
              <dl className="flex flex-wrap gap-4" aria-label="移動区分別人数">
                {Object.entries(comparison.movement.counts ?? {}).map(
                  ([category, count]) => (
                    <div key={category}>
                      <dt>{categories[category as RfMovementCategory]}</dt>
                      <dd>{count}人</dd>
                    </div>
                  ),
                )}
              </dl>
              {comparison.movement.transitions.length === 0 ? (
                <p>比較対象の顧客がいません。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-left text-sm"
                    aria-label="開始月から終了月へのRFランク移動"
                  >
                    <thead>
                      <tr>
                        {["開始ランク", "終了ランク", "区分", "人数"].map(
                          (title) => (
                            <th
                              scope="col"
                              className="border-b p-3"
                              key={title}
                            >
                              {title}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.movement.transitions.map(
                        (transition, index) => (
                          <tr key={index}>
                            <td className="border-b p-3">
                              {rankLabel(
                                transition.from_rank,
                                transition.from_state,
                              )}
                            </td>
                            <td className="border-b p-3">
                              {rankLabel(
                                transition.to_rank,
                                transition.to_state,
                              )}
                            </td>
                            <td className="border-b p-3">
                              {categories[transition.category]}
                            </td>
                            <td className="border-b p-3">
                              {transition.count}人
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
