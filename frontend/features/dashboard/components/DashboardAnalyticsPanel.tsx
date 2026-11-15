"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiRead } from "@/hooks/useApiRead";
import type { DashboardAnalytics } from "../types";

const INSIGHTS = [
  [
    "regular",
    "定期的に来店しているお客様",
    "直近12か月に4回以上の実来店。金額や印象によらない常連の目安です。",
  ],
  [
    "overdue",
    "ご無沙汰のお客様",
    "直近12か月に4回以上来店し、最終来店から90日を超えたお客様。",
  ],
  [
    "new_returning",
    "初回来店後に再来店したお客様",
    "記録上の初回来店が今月で、今月の別日に再来店したお客様。",
  ],
  [
    "slowing",
    "来店間隔が長くなっているお客様",
    "4日以上の来店履歴があり、過去の間隔中央値の1.5倍を超えて未再来店。RF判定とは別の目安です。",
  ],
] as const;

// 分析APIの実績だけを表示し、期間切替は取得済みの12か月から選ぶ。
export function DashboardAnalyticsPanel({ reload }: { reload: number }) {
  const { data, error, loading } = useApiRead<DashboardAnalytics>(
    "/api/v1/dashboard_analytics",
    reload,
  );
  const [months, setMonths] = useState(6);
  if (loading) return <p role="status">店舗・顧客の傾向を集計しています。</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return null;
  const kpi = data.kpis;
  const series = data.monthly_series.slice(-months);
  const maximum = Math.max(
    1,
    ...series.flatMap((point) => [point.reservations, point.visits]),
  );
  const values = [
    [
      "今月の予約",
      `${kpi.monthly_reservations}件`,
      `${data.period.current_month}・キャンセルを除く予定`,
    ],
    [
      "年間累計来店",
      `${kpi.annual_visits}件`,
      `${data.period.year}年・完了済みの来店`,
    ],
    ["今月の新規来店顧客", `${kpi.new_customers}名`, "記録上の初回来店が今月"],
    [
      "今月の再来店顧客比率",
      kpi.returning_customer_ratio === null
        ? "算出できません"
        : `${kpi.returning_customer_ratio}%`,
      `${kpi.returning_customer_count}名 / 今月来店した顧客${kpi.monthly_customer_count}名`,
    ],
    [
      "ご無沙汰のお客様",
      `${kpi.overdue_customers}名`,
      "表示中の顧客・常連の目安に該当し90日超の未再来店",
    ],
  ];
  return (
    <section className="space-y-8" aria-label="店舗と顧客の分析">
      <header>
        <h2 className="text-2xl font-semibold">店舗とお客様の傾向</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          来店実績は{data.period.through}
          までの完了済み・未キャンセルの予約です。来店比率は顧客を特定できる記録を使用します。
        </p>
      </header>
      <dl className="grid gap-px overflow-hidden rounded-lg bg-muted sm:grid-cols-2 xl:grid-cols-5">
        {values.map(([label, value, note]) => (
          <div
            className="bg-card p-5 sm:last:col-span-2 xl:last:col-span-1"
            key={label}
          >
            <dt className="text-sm font-medium">{label}</dt>
            <dd className="mt-3 text-2xl font-semibold tabular-nums">
              {value}
            </dd>
            <dd className="mt-2 text-xs leading-5 text-muted-foreground">
              {note}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section
          className="colette-surface space-y-4"
          aria-labelledby="visit-trend-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="visit-trend-title" className="text-lg font-semibold">
              予約・来店の推移
            </h3>
            <label className="text-sm">
              表示期間{" "}
              <select
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                className="ml-2 rounded border border-input p-2"
              >
                {[3, 6, 12].map((value) => (
                  <option key={value} value={value}>
                    直近{value}か月
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="flex flex-wrap gap-4 text-sm">
            <span>
              <span
                aria-hidden="true"
                className="mr-2 inline-block size-3 bg-chart-2"
              />
              予約（件）
            </span>
            <span>
              <span
                aria-hidden="true"
                className="mr-2 inline-block size-3 bg-primary"
              />
              来店（件）
            </span>
          </p>
          {/* 表示月数で文字サイズや高さが変わらない、固定高の棒グラフ。 */}
          <div
            role="img"
            aria-label="月別の予約件数と来店件数。正確な値は下の表でも確認できます。"
            className="overflow-x-auto"
          >
            <div
              className="flex items-end gap-3 pt-4"
              style={{ minWidth: `${series.length * 56}px` }}
            >
              {series.map((point) => (
                <div key={point.month} className="min-w-0 flex-1 text-center">
                  <div className="flex h-44 items-end justify-center gap-1">
                    <div
                      title={`${point.month} 予約${point.reservations}件`}
                      className="w-7 max-w-[40%] bg-chart-2"
                      style={{
                        height: `${(point.reservations / maximum) * 100}%`,
                      }}
                    />
                    <div
                      title={`${point.month} 来店${point.visits}件`}
                      className="w-7 max-w-[40%] bg-primary"
                      style={{ height: `${(point.visits / maximum) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 whitespace-nowrap text-xs">
                    {point.month.slice(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-primary underline">
              数値を表で確認
            </summary>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">月別予約・来店件数</caption>
              <thead>
                <tr>
                  <th scope="col">年月</th>
                  <th scope="col">予約（件）</th>
                  <th scope="col">来店（件）</th>
                </tr>
              </thead>
              <tbody>
                {series.map((point) => (
                  <tr key={point.month}>
                    <th scope="row">{point.month}</th>
                    <td className="text-center">{point.reservations}</td>
                    <td className="text-center">{point.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <p className="text-xs text-muted-foreground">
            当月の予約には今後の予定を含み、来店は今日までの実績です。
          </p>
        </section>
        <section
          className="colette-surface space-y-4"
          aria-labelledby="rf-distribution-title"
        >
          <h3 id="rf-distribution-title" className="text-lg font-semibold">
            RFランク別の顧客数
          </h3>
          {data.rf ? (
            <>
              <p className="text-sm text-muted-foreground">
                {data.rf.base_date}を基準とする適用済み結果
              </p>
              <ul className="space-y-3">
                {data.rf.ranks.map((rank) => (
                  <li key={rank.id}>
                    <Link
                      className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 hover:bg-accent focus-visible:ring-2"
                      href={`/rf-customers?run_id=${data.rf!.calculation_run_id}&rf_rank_id=${rank.id}&return_to=%2Fdashboard`}
                    >
                      <span>{rank.label}</span>
                      <span className="font-semibold tabular-nums">
                        {rank.count}名 →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-sm">
                計算対象外 {data.rf.excluded_count}名 / 未分類{" "}
                {data.rf.unmatched_count}名
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              適用済みのRF計算結果がありません。RF計算・適用後に表示します。
            </p>
          )}
        </section>
      </div>
      <section aria-labelledby="customer-insights-title" className="space-y-4">
        <h3 id="customer-insights-title" className="text-xl font-semibold">
          接客のヒント
        </h3>
        <p className="text-sm text-muted-foreground">
          以下は来店記録に基づく暫定的な目安です。RFランク判定・金額評価とは別に表示しています。各項目は表示中の顧客から最大5名です。
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {INSIGHTS.map(([key, title, description]) => (
            <section key={key} className="colette-surface space-y-3">
              <h4 className="font-semibold">
                {title}
                <span className="ml-3 text-sm font-normal">
                  {data.insights[key].count}名
                </span>
              </h4>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              {data.insights[key].customers.length === 0 ? (
                <p className="text-sm">
                  該当する来店記録がないか、判定に必要な履歴が不足しています。
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.insights[key].customers.map((customer) => (
                    <li key={customer.id}>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/40 px-3 py-3 hover:bg-accent"
                      >
                        <span className="font-medium text-primary underline underline-offset-4">
                          {customer.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          最終来店 {customer.last_visit_on} /{" "}
                          {customer.days_since_visit}日前
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </section>
    </section>
  );
}
