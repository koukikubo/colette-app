/**
 * RFランクの年月比較画面を構成する。
 *
 * 比較月の入力、API取得、読み込み・エラー・結果の表示を担当する。
 * 移動マトリクスの描画とセル選択はRfMovementMatrixへ委譲する。
 *
 * 入力変更時は通信を中止し、古い条件の結果が画面に残ることを防ぐ。
 */

"use client";

import Link from "next/link";
import { useUrlQuery } from "@/hooks/useUrlQuery";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/api-client";
import {
  fetchRfComparisonPeriods,
  type RfComparisonPeriod,
  fetchRfMonthComparison,
} from "../api/customer-transition-api";
import type { RfMonthComparison } from "../types/customer-transition";
import { RfMovementMatrix } from "./RfMovementMatrix";
import { RfMovementOverview } from "./RfMovementOverview";
import { RfHelpHint } from "./RfHelpHint";

/**
 * 比較条件と取得状態を管理し、期間入力・概要・マトリクスを表示する。
 */
export function RfCustomerTransitionSection() {
  const { params, update } = useUrlQuery();
  const startMonth = params.get("start_month") ?? "";
  const endMonth = params.get("end_month") ?? "";
  const [periods, setPeriods] = useState<RfComparisonPeriod[]>([]);
  const [periodError, setPeriodError] = useState(false);
  const [periodReload, setPeriodReload] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const firstComparison = useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    async function loadPeriods() {
      try {
        const response = await fetchRfComparisonPeriods(controller.signal);
        if (controller.signal.aborted) return;
        setPeriodError(false);
        const available = response.data.periods;
        setPeriods(available);
        const current = new URLSearchParams(window.location.search);
        if (
          !current.get("start_month") &&
          !current.get("end_month") &&
          available.length > 1
        ) {
          const end = available[0];
          const yearAgo = `${Number(end.month.slice(0, 4)) - 1}${end.month.slice(4)}`;
          const start =
            available.find(
              (item) =>
                item.month === yearAgo && item.rule_set_id === end.rule_set_id,
            ) ??
            available.find(
              (item) =>
                item.month !== end.month &&
                item.rule_set_id === end.rule_set_id,
            );
          if (start) update({ start_month: start.month, end_month: end.month });
        }
      } catch {
        if (!controller.signal.aborted) setPeriodError(true);
      } finally {
        if (!controller.signal.aborted) setInitialized(true);
      }
    }
    void loadPeriods();
    return () => controller.abort();
  }, [update, periodReload]);
  const [comparison, setComparison] = useState<RfMonthComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  /**
   * 指定された側の比較月を変更する。
   *
   * 進行中の通信を中止し、前の結果とエラーを消すことで、
   * 入力した年月と表示中の結果が食い違うことを防ぐ。
   */
  function changeMonth(value: string, side: "start" | "end") {
    pending.current?.abort();
    setIsLoading(false);
    setComparison(null);
    setErrorMessage(null);
    firstComparison.current = false;
    update(side === "start" ? { start_month: value } : { end_month: value });
  }

  /**
   * APIのYYYY-MM形式を、利用者向けの「YYYY年M月」へ整形する。
   * 日付オブジェクトを使わず、タイムゾーンによる年月のずれを避ける。
   */
  function formatComparisonMonth(value: string) {
    const [year, month] = value.split("-");
    return `${year}年${Number(month)}月`;
  }

  /**
   * 入力した開始月・終了月で比較APIを呼び出す。
   *
   * 中止されたリクエストの結果は反映しない。
   * APIから返る履歴不足・ルール違いなどの理由も画面へ表示する。
   */
  const compare = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
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
    },
    [startMonth, endMonth],
  );

  useEffect(() => {
    if (initialized && firstComparison.current && startMonth && endMonth) {
      firstComparison.current = false;
      void compare();
    }
  }, [initialized, startMonth, endMonth, compare]);

  return (
    <section aria-label="RFランクの2時点比較">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>
              <h2>開始月・終了月のランク移動</h2>
            </CardTitle>

            <RfHelpHint label="比較方法について">
              <p>
                各月の適用済み履歴から、計算基準日が最も新しい結果を比較します。
                月末時点を再計算する機能ではありません。
              </p>
              <p>
                途中の変動は合算しません。途中がA→B→Aでも、
                開始・終了がAなら維持です。
              </p>
              <p>
                履歴のない月や、RFルールが異なる月同士は比較できません。
                比較によって現在のランクが変更されることはありません。
              </p>
            </RfHelpHint>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {periodError && (
            <p role="alert">
              履歴候補を取得できませんでした。
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriodReload((value) => value + 1)}
              >
                候補を再取得
              </Button>
            </p>
          )}
          <details>
            <summary>比較できる適用済み履歴（{periods.length}件）</summary>
            <ul>
              {periods.map((item) => (
                <li
                  key={item.run_id}
                  className="flex flex-wrap items-center gap-2 p-2"
                >
                  <span>
                    {item.month} ／ 基準日 {item.base_date}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => changeMonth(item.month, "start")}
                  >
                    {item.month}を開始月に設定
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => changeMonth(item.month, "end")}
                  >
                    {item.month}を終了月に設定
                  </Button>
                </li>
              ))}
            </ul>
            {initialized && !periodError && periods.length === 0 && (
              <p>
                比較できる適用済み履歴がありません。計算・適用後に再取得してください。
              </p>
            )}
          </details>
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
            <div className="space-y-6">
              <RfMovementOverview counts={comparison.movement.counts} />
              <nav className="flex flex-wrap gap-4">
                {(["up", "down", "unchanged"] as const).map((category) => (
                  <Link
                    key={category}
                    className="underline"
                    href={`/rf-customers?${new URLSearchParams({ run_id: String(comparison.end_run.id), comparison_run_id: String(comparison.start_run.id), category, return_to: `/rf-customer-transitions?start_month=${startMonth}&end_month=${endMonth}` })}`}
                  >
                    {category === "up"
                      ? "上昇"
                      : category === "down"
                        ? "下降"
                        : "維持"}
                    した顧客 {comparison.movement.counts[category]}人
                  </Link>
                ))}
              </nav>

              <div className="space-y-3">
                {/* 選択中の入力値ではなく、取得済み結果の年月を表示する。 */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    対象期間
                  </span>

                  <p className="text-sm font-semibold tabular-nums">
                    {formatComparisonMonth(comparison.start_month)}
                    <span
                      aria-label="から"
                      className="mx-3 text-muted-foreground"
                    >
                      →
                    </span>
                    {formatComparisonMonth(comparison.end_month)}
                  </p>

                  <RfHelpHint label="対象期間と計算基準日について">
                    <p>比較に使用した実際の計算基準日です。</p>
                    <p>
                      開始：{comparison.start_run.base_date}
                      <br />
                      終了：{comparison.end_run.base_date}
                    </p>
                    <p>
                      指定月内の最新の計算結果を使うため、
                      月末日と一致しない場合があります。
                    </p>
                    {comparison.provisional && (
                      <p>
                        当月を含むため暫定結果です。
                        今日までの適用済み計算を使用しています。
                      </p>
                    )}
                  </RfHelpHint>

                  {comparison.provisional && (
                    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      暫定
                    </span>
                  )}
                </div>

                <RfMovementMatrix
                  key={`${comparison.start_run.id}:${comparison.end_run.id}`}
                  transitions={comparison.movement.transitions}
                  customerHref={(from, to) =>
                    `/rf-customers?${new URLSearchParams({ run_id: String(comparison.end_run.id), comparison_run_id: String(comparison.start_run.id), from_state: from.state, to_state: to.state, ...(from.rank ? { from_rank_id: String(from.rank.id) } : {}), ...(to.rank ? { to_rank_id: String(to.rank.id) } : {}), return_to: `/rf-customer-transitions?start_month=${startMonth}&end_month=${endMonth}` })}`
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
