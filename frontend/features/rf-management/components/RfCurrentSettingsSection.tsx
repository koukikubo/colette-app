"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useRfSettings } from "../hooks/useRfSettings";
import type { RfCalculationStatus } from "../types";

const STATUS_LABELS: Record<RfCalculationStatus, string> = {
  pending: "実行待ち",
  processing: "計算中",
  completed: "計算完了",
  failed: "失敗",
};

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

export function RfCurrentSettingsSection() {
  const { settings, isLoading, errorMessage } = useRfSettings();

  if (isLoading) {
    return (
      <section aria-labelledby="current-rf-settings-heading">
        <h2
          id="current-rf-settings-heading"
          className="mb-3 text-lg font-semibold"
        >
          現在のRF設定
        </h2>

        <div role="status" className="space-y-3">
          <span className="sr-only">RF設定を読み込んでいます。</span>
          <Skeleton className="h-48 w-full" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section aria-labelledby="current-rf-settings-heading">
        <h2
          id="current-rf-settings-heading"
          className="mb-3 text-lg font-semibold"
        >
          現在のRF設定
        </h2>

        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      </section>
    );
  }

  const ruleSet = settings?.published_rule_set;
  const calculationRun = settings?.current_calculation_run;

  return (
    <section aria-labelledby="current-rf-settings-heading">
      <h2
        id="current-rf-settings-heading"
        className="mb-3 text-lg font-semibold"
      >
        現在のRF設定
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>公開中の判定ルール</CardTitle>
              {ruleSet && <Badge>公開中</Badge>}
            </div>
          </CardHeader>

          <CardContent>
            {ruleSet ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{ruleSet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    バージョン {ruleSet.version}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">集計期間</dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {ruleSet.aggregation_months}か月
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">
                      来店回数の対象
                    </dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {ruleSet.frequency_window_months}か月
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                公開中の判定ルールはありません。
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>現在の計算結果</CardTitle>
              {calculationRun && (
                <Badge variant="outline">
                  {STATUS_LABELS[calculationRun.status]}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {calculationRun ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">計算基準日</p>
                  <p className="font-medium">
                    {formatDate(calculationRun.base_date)}
                  </p>
                </div>

                <dl className="grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">対象顧客</dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {calculationRun.customer_count}名
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">対象外</dt>
                    <dd className="mt-1 font-medium">
                      対象外 {calculationRun.excluded_count}名
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">未分類</dt>
                    <dd className="mt-1 font-medium">
                      未分類 {calculationRun.unmatched_count}名
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                適用中の計算結果はありません。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
