"use client";

import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

import { RF_CALCULATION_STATUS_LABELS } from "../constants";
import { useRfCalculationRunDetail } from "../hooks/useRfCalculationRunDetail";
import { RfCalculationResultsSection } from "./RfCalculationResultsSection";

type RfCalculationRunDetailDrawerProps = {
  open: boolean;
  calculationRunId: number | null;
  onOpenChange: (open: boolean) => void;
};

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

export function RfCalculationRunDetailDrawer({
  open,
  calculationRunId,
  onOpenChange,
}: RfCalculationRunDetailDrawerProps) {
  const { calculationRun, isLoading, errorMessage } = useRfCalculationRunDetail(
    open ? calculationRunId : null,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-2xl">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DrawerTitle>RF計算履歴の詳細</DrawerTitle>
              <DrawerDescription>
                計算条件とランク別の集計結果を確認します。
              </DrawerDescription>
            </div>

            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="閉じる"
              >
                <XIcon aria-hidden="true" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div role="status" className="space-y-4">
              <span className="sr-only">
                RF計算履歴の詳細を読み込んでいます。
              </span>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && calculationRun && (
            <div className="space-y-6">
              <section aria-labelledby="calculation-summary-heading">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3
                    id="calculation-summary-heading"
                    className="font-semibold"
                  >
                    計算概要
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {RF_CALCULATION_STATUS_LABELS[calculationRun.status]}
                    </Badge>

                    {calculationRun.current && <Badge>現在適用中</Badge>}
                  </div>
                </div>

                <dl className="mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      計算基準日
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatDate(calculationRun.base_date)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">実行者</dt>
                    <dd className="mt-1 font-medium">
                      {calculationRun.started_by_staff?.name ?? "システム"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">
                      集計開始日
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatDate(calculationRun.aggregation_started_on)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">
                      来店回数の集計開始日
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatDate(calculationRun.frequency_started_on)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="calculation-count-heading">
                <h3 id="calculation-count-heading" className="font-semibold">
                  集計件数
                </h3>

                <dl className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-4">
                    <dt className="text-xs text-muted-foreground">対象顧客</dt>
                    <dd className="mt-1 text-lg font-semibold">
                      対象 {calculationRun.customer_count}名
                    </dd>
                  </div>

                  <div className="rounded-lg border p-4">
                    <dt className="text-xs text-muted-foreground">対象外</dt>
                    <dd className="mt-1 text-lg font-semibold">
                      対象外 {calculationRun.excluded_count}名
                    </dd>
                  </div>

                  <div className="rounded-lg border p-4">
                    <dt className="text-xs text-muted-foreground">未分類</dt>
                    <dd className="mt-1 text-lg font-semibold">
                      未分類 {calculationRun.unmatched_count}名
                    </dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="rank-count-heading">
                <h3 id="rank-count-heading" className="font-semibold">
                  ランク別人数
                </h3>

                {calculationRun.rank_counts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    ランク別の集計結果はありません。
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {calculationRun.rank_counts.map((rankCount) => (
                      <li key={rankCount.id}>
                        <Badge variant="secondary">
                          {rankCount.label} {rankCount.count}名
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <RfCalculationResultsSection
                key={calculationRun.id}
                calculationRunId={calculationRun.id}
              />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
