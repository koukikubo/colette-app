"use client";

import Link from "next/link";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";

import { useRfCalculationResults } from "../../hooks/useRfCalculationResults";
import type { RfRank } from "../../types";

type RfCalculationResultsSectionProps = {
  calculationRunId: number;
};

function formatDate(date: string | null) {
  return date ? date.replaceAll("-", "/") : "来店履歴なし";
}

function previousRankLabel(rank: RfRank | null) {
  return rank?.label ?? "未設定";
}

function currentRankLabel(rank: RfRank | null, exclusionReason: string | null) {
  if (exclusionReason) {
    return "対象外";
  }

  return rank?.label ?? "Nランク";
}

export function RfCalculationResultsSection({
  calculationRunId,
}: RfCalculationResultsSectionProps) {
  const { currentPage, perPage, setCurrentPage, setPerPage, resetPage } =
    usePagination({
      initialPerPage: 20,
    });

  const { results, pagination, isLoading, errorMessage } =
    useRfCalculationResults({
      calculationRunId,
      page: currentPage,
      perPage,
    });

  function handlePerPageChange(nextPerPage: number) {
    setPerPage(nextPerPage);
    resetPage();
  }

  return (
    <section aria-labelledby="rf-customer-results-heading">
      <h3 id="rf-customer-results-heading" className="font-semibold">
        顧客別判定結果
      </h3>

      {isLoading && (
        <div role="status" className="mt-3 space-y-3">
          <span className="sr-only">顧客別RF計算結果を読み込んでいます。</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && results.length === 0 && (
        <div className="mt-3 rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            顧客別の判定結果はありません。
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && results.length > 0 && (
        <ul className="mt-3 divide-y rounded-lg border">
          {results.map((result) => (
            <li
              key={result.id}
              className="grid gap-4 p-4 md:grid-cols-[1.2fr_1.5fr_1.5fr_auto] md:items-center"
            >
              <div>
                <p className="font-medium">{result.customer.name}</p>

                {result.changed && (
                  <Badge variant="secondary" className="mt-1">
                    ランク変更
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">RFランク</p>

                <p className="mt-1 font-medium">
                  {previousRankLabel(result.previous_rf_rank)}
                  {" → "}
                  {currentRankLabel(result.rf_rank, result.exclusion_reason)}
                </p>

                {result.exclusion_reason && (
                  <div className="mt-1">
                    <Badge variant="outline">対象外</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.exclusion_reason}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">判定根拠</p>

                <div className="mt-1 space-y-1 text-sm">
                  <p>
                    {result.recency_days === null
                      ? "最終来店なし"
                      : `最終来店から${result.recency_days}日`}
                  </p>

                  <p>
                    {result.frequency_count === null
                      ? "来店回数なし"
                      : `来店回数${result.frequency_count}回`}
                  </p>

                  <p className="text-muted-foreground">
                    {formatDate(result.last_visit_on)}
                  </p>
                </div>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href={`/customers/${result.customer.id}`}>顧客詳細</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.total_count > 0 && (
        <PaginationControls
          className="mt-4"
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          totalCount={pagination.total_count}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </section>
  );
}
