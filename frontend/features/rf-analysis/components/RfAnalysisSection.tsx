"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useRfAnalysis } from "../hooks/useRfAnalysis";
import { RfDistributionTable } from "./RfDistributionTable";
import { RfYearComparisonTable } from "./RfYearComparisonTable";
import { RfRankSummaryTable } from "./RfRankSummaryTable";

type RfAnalysisSectionProps = {
  reloadKey?: number;
};

function formatDate(value: string) {
  return value.replaceAll("-", "/");
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");

  return `${Number(year)}年${Number(month)}月集計`;
}

export function RfAnalysisSection({ reloadKey = 0 }: RfAnalysisSectionProps) {
  const { analysis, isLoading, errorMessage } = useRfAnalysis(reloadKey);

  if (isLoading) {
    return (
      <section aria-labelledby="rf-analysis-heading">
        <h2 id="rf-analysis-heading" className="mb-3 text-lg font-semibold">
          統一RFランク表
        </h2>

        <div role="status">
          <span className="sr-only">RF分析結果を読み込んでいます。</span>
          <Skeleton className="h-96 w-full" />
        </div>
      </section>
    );
  }
  if (errorMessage) {
    return (
      <section aria-label="RF分析結果">
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section aria-label="RF分析結果">
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          適用中のRF計算結果がありません。RF計算を実行して結果を適用してください。
        </p>
      </section>
    );
  }

  return (
    <section aria-label="RF分析結果" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              <h2>{formatMonth(analysis.calculation_run.base_date)}</h2>
            </CardTitle>

            <Badge variant="secondary">現在適用中</Badge>
          </div>

          <CardDescription>
            {analysis.calculation_run.rule_set.name}
            {" / "}
            バージョン {analysis.calculation_run.rule_set.version}
            {" / "}
            計算基準日：
            {formatDate(analysis.calculation_run.base_date)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs text-muted-foreground">計算対象</dt>
              <dd className="mt-1 text-xl font-semibold">
                {analysis.eligible_count.toLocaleString("ja-JP")}名
              </dd>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs text-muted-foreground">来店履歴なし</dt>
              <dd className="mt-1 text-xl font-semibold">
                {analysis.no_visit.count.toLocaleString("ja-JP")}名
              </dd>
              <p className="text-xs text-muted-foreground">
                {analysis.no_visit.percentage.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs text-muted-foreground">計算対象外</dt>
              <dd className="mt-1 text-xl font-semibold">
                {analysis.excluded_count.toLocaleString("ja-JP")}名
              </dd>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs text-muted-foreground">未分類</dt>
              <dd className="mt-1 text-xl font-semibold">
                {analysis.unmatched_count.toLocaleString("ja-JP")}名
              </dd>
              <p className="text-xs text-muted-foreground">
                {analysis.unmatched_percentage.toFixed(2)}%
              </p>
            </div>
          </dl>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">ランク別構成</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                各RFランクの顧客数と、計算対象顧客に占める割合です。
              </p>
            </div>

            <RfRankSummaryTable ranks={analysis.rank_distribution} />
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">統一RFランク表</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              最終来店期間と来店回数の組み合わせごとに顧客分布を表示します。
            </p>
            <RfDistributionTable
              recencyRules={analysis.recency_rules}
              frequencyRules={analysis.frequency_rules}
              cells={analysis.cells}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>前年同月</CardTitle>
          <CardDescription>
            現在と前年同月のランク別人数・構成割合を比較します。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <RfYearComparisonTable comparison={analysis.comparison} />
        </CardContent>
      </Card>
    </section>
  );
}
