"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { RF_CALCULATION_STATUS_LABELS } from "../../constants";
import { useRfSettings } from "../../hooks/useRfSettings";
import { previewValues } from "../rule-sets/RfRuleSetDetailDialog";
import { RfRuleSetPreviewTable } from "../rule-sets/RfRuleSetPreviewTable";

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

type RfCurrentSettingsSectionProps = {
  reloadKey?: number;
};

export function RfCurrentSettingsSection({
  reloadKey = 0,
}: RfCurrentSettingsSectionProps) {
  const { settings, isLoading, errorMessage } = useRfSettings(reloadKey);

  if (isLoading) {
    return (
      <section aria-labelledby="current-rf-settings-heading">
        <h2
          id="current-rf-settings-heading"
          className="mb-3 text-lg font-semibold"
        >
          現在適用中のRF設定
        </h2>
        <div role="status" className="space-y-3">
          <span className="sr-only">RF設定を読み込んでいます。</span>
          <Skeleton className="h-72 w-full" />
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
          現在適用中のRF設定
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

  const publishedRuleSet = settings?.published_rule_set;
  const appliedRuleSet = settings?.applied_rule_set;
  const calculationRun = settings?.current_calculation_run;
  const preview = appliedRuleSet ? previewValues(appliedRuleSet) : null;

  return (
    <section
      aria-labelledby="current-rf-settings-heading"
      className="space-y-4"
    >
      <div>
        <h2 id="current-rf-settings-heading" className="text-lg font-semibold">
          現在適用中のRF設定
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          現在の顧客ランクに使用されている計算結果と判定条件です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                {appliedRuleSet?.name ?? "適用中のRF設定はありません"}
              </CardTitle>
              {appliedRuleSet && (
                <p className="mt-1 text-sm text-muted-foreground">
                  バージョン {appliedRuleSet.version}
                </p>
              )}
            </div>
            {calculationRun && (
              <Badge>
                {RF_CALCULATION_STATUS_LABELS[calculationRun.status]}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {calculationRun && appliedRuleSet && preview ? (
            <>
              <dl className="grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <dt className="text-xs text-muted-foreground">計算基準日</dt>
                  <dd className="mt-1 font-medium">
                    {formatDate(calculationRun.base_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">対象顧客</dt>
                  <dd className="mt-1 font-medium">
                    {calculationRun.customer_count}名
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">対象外</dt>
                  <dd className="mt-1 font-medium">
                    {calculationRun.excluded_count}名
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">未分類</dt>
                  <dd className="mt-1 font-medium">
                    {calculationRun.unmatched_count}名
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">集計期間</dt>
                  <dd className="mt-1 font-medium">
                    {appliedRuleSet.aggregation_months}か月
                  </dd>
                </div>
              </dl>

              <RfRuleSetPreviewTable
                {...preview}
                heading="現在適用中のRFランク対応表"
              />

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="font-medium">表の見方</p>
                  <p className="mt-1 text-muted-foreground">
                    行が最終来店からの期間、列が対象期間内の来店回数です。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-medium">未分類</p>
                  <p className="mt-1 text-muted-foreground">
                    条件に一致しない顧客です。ルール設定の見直し対象になります。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-medium">対象外</p>
                  <p className="mt-1 text-muted-foreground">
                    顧客ランクRなど、RF計算の対象から除外された顧客です。
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              計算結果を適用すると、ここに現在の判定条件が表示されます。
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>次回計算に使用するルール</CardTitle>
            {publishedRuleSet && <Badge variant="outline">公開中</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {publishedRuleSet ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{publishedRuleSet.name}</p>
                <p className="text-sm text-muted-foreground">
                  バージョン {publishedRuleSet.version}・集計期間{" "}
                  {publishedRuleSet.aggregation_months}か月
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                新しいRF計算を実行すると、このルールが使用されます。
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              公開中のルールがありません。下書きを公開するとRF計算を実行できます。
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
