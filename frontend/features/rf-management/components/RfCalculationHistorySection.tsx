"use client";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";

import { useRfCalculationRuns } from "../hooks/useRfCalculationRuns";
import type { RfCalculationStatus } from "../types";
import { RF_CALCULATION_STATUS_LABELS } from "../constants";

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

export function RfCalculationHistorySection() {
  const { currentPage, setCurrentPage } = usePagination({
    initialPerPage: 10,
  });

  const { calculationRuns, pagination, isLoading, errorMessage } =
    useRfCalculationRuns({
      page: currentPage,
      perPage: 10,
    });

  if (isLoading) {
    return (
      <section aria-labelledby="rf-calculation-history-heading">
        <h2
          id="rf-calculation-history-heading"
          className="mb-3 text-lg font-semibold"
        >
          計算履歴
        </h2>

        <div role="status" className="space-y-3">
          <span className="sr-only">RF計算履歴を読み込んでいます。</span>
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section aria-labelledby="rf-calculation-history-heading">
        <h2
          id="rf-calculation-history-heading"
          className="mb-3 text-lg font-semibold"
        >
          計算履歴
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

  return (
    <section aria-labelledby="rf-calculation-history-heading">
      <h2
        id="rf-calculation-history-heading"
        className="mb-3 text-lg font-semibold"
      >
        計算履歴
      </h2>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>RFランク計算の実行履歴</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {calculationRuns.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">
                RF計算履歴はまだありません。
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {calculationRuns.map((calculationRun) => (
                <li
                  key={calculationRun.id}
                  className="grid gap-4 p-4 md:grid-cols-[1fr_1.5fr_2fr_1fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">計算基準日</p>
                    <p className="mt-1 font-medium">
                      {formatDate(calculationRun.base_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">使用ルール</p>
                    <p className="mt-1 font-medium">
                      {calculationRun.rule_set.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      バージョン {calculationRun.rule_set.version}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">計算結果</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <span>対象 {calculationRun.customer_count}名</span>
                      <span>対象外 {calculationRun.excluded_count}名</span>
                      <span>未分類 {calculationRun.unmatched_count}名</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">実行者</p>
                    <p className="mt-1 font-medium">
                      {calculationRun.started_by_staff?.name ?? "システム"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge variant="outline">
                      {RF_CALCULATION_STATUS_LABELS[calculationRun.status]}
                    </Badge>

                    {calculationRun.current && <Badge>現在適用中</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>

        {pagination && pagination.total_count > 0 && (
          <CardFooter>
            <PaginationControls
              className="w-full"
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalCount={pagination.total_count}
              onPageChange={setCurrentPage}
            />
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
