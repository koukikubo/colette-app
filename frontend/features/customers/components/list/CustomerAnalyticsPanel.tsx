"use client";
import Link from "next/link";
import { ArrowUpRightIcon, RefreshCwIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerAnalyticsData } from "../../types";

type Props = {
  data: CustomerAnalyticsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

// RFの履歴ランクと最新の退店実績を混同させず、集計期間と対象を明示する。
export function CustomerAnalyticsPanel({
  data,
  loading,
  error,
  onRetry,
}: Props) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="顧客の集計を読み込み中"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="rounded-2xl bg-destructive/10 p-6">
        <p>{error}</p>
        <Button variant="outline" className="mt-3" onClick={onRetry}>
          集計を再読み込み
        </Button>
      </div>
    );
  if (!data) return null;
  const { summary, period, ranking } = data;
  return (
    <section aria-label="顧客の来店分析" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <UsersIcon className="size-4" aria-hidden="true" />
            顧客の来店分析
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            表示中の顧客・退店済みの予約が対象です。RFの計算履歴とは集計時点が異なります。
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCwIcon aria-hidden="true" />
          集計を更新
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["表示中の顧客数", `${summary.customer_count}人`],
          ["今月の来店件数", `${summary.monthly_visits}件`],
          ["今月の来店顧客数", `${summary.monthly_customers}人`],
          [
            "今月の再来店率",
            summary.returning_ratio === null
              ? "算出できません"
              : `${summary.returning_ratio}%`,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        今月：{period.month_from}〜{period.through}
        。再来店率は、今月来店した顧客のうち、別日の過去来店がある顧客の割合です（
        {summary.returning_customers}人／{summary.monthly_customers}人）。
      </p>
      <div className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">来店回数ランキング</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {period.ranking_from}〜{period.through}
          ・上位10名。同日の複数予約はそれぞれ1件として数えます。
        </p>
        {ranking.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            集計期間内の来店実績はありません。
          </p>
        ) : (
          <ol className="mt-4 grid gap-2 lg:grid-cols-2">
            {ranking.map((customer, index) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/${customer.id}?return_to=%2Fcustomers`}
                  className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block wrap-anywhere font-medium">
                      {customer.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      最終来店 {customer.last_visit_on}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {customer.visit_count}回
                  </span>
                  <ArrowUpRightIcon
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
