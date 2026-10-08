"use client";

import { useState } from "react";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";

import { useRfCalculationRuns } from "../../hooks/useRfCalculationRuns";
import {
  RfCalculationStatusBadge,
  RfCurrentStatusBadge,
} from "../status/RfStatusBadge";

import {
  CheckCircle2Icon,
  ChevronRightIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RfCalculationRunDetailDrawer } from "./RfCalculationRunDetailDrawer";

type RfCalculationHistorySectionProps = {
  reloadKey?: number;
  onApplied?: () => void;
};

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

export function RfCalculationHistorySection({
  reloadKey = 0,
  onApplied,
}: RfCalculationHistorySectionProps) {
  const [selectedCalculationRunId, setSelectedCalculationRunId] = useState<
    number | null
  >(null);

  const { currentPage, setCurrentPage } = usePagination({
    initialPerPage: 10,
  });

  const { calculationRuns, pagination, isLoading, errorMessage } =
    useRfCalculationRuns({
      page: currentPage,
      perPage: 10,
      reloadKey,
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

  const currentRun = calculationRuns.find((run) => run.current);
  const runningRun = calculationRuns.find(
    (run) => run.status === "pending" || run.status === "processing",
  );
  const completedRun = calculationRuns.find(
    (run) =>
      run.status === "completed" &&
      !run.current &&
      !run.restorable &&
      (currentRun
        ? run.previous_run_id === currentRun.id
        : run.previous_run_id === null),
  );
  const attentionRun =
    currentPage === 1 ? (runningRun ?? completedRun) : undefined;

  return (
    <section
      aria-labelledby="rf-calculation-history-heading"
      className="space-y-4"
    >
      <h2 id="rf-calculation-history-heading" className="text-lg font-semibold">
        計算履歴
      </h2>

      {attentionRun && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {attentionRun.status === "completed" ? (
                <CheckCircle2Icon
                  className="mt-0.5 size-5 text-green-600"
                  aria-hidden="true"
                />
              ) : (
                <LoaderCircleIcon
                  className="mt-0.5 size-5 animate-spin text-primary"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="font-semibold">
                  {attentionRun.status === "completed"
                    ? "RF計算が完了しました"
                    : "RF計算を実行しています"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attentionRun.rule_set.name}・計算基準日{" "}
                  {formatDate(attentionRun.base_date)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attentionRun.status === "completed"
                    ? "変更内容を確認して、顧客のRFランクへ適用してください。"
                    : "画面を離れても計算は継続します。再表示すると最新状態を確認できます。"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setSelectedCalculationRunId(attentionRun.id)}
            >
              {attentionRun.status === "completed"
                ? "結果を確認して適用"
                : "進捗を確認"}
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}

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

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <RfCalculationStatusBadge status={calculationRun.status} />

                    {calculationRun.current && <RfCurrentStatusBadge />}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`計算履歴${calculationRun.id}の詳細を開く`}
                      onClick={() =>
                        setSelectedCalculationRunId(calculationRun.id)
                      }
                    >
                      詳細
                      <ChevronRightIcon aria-hidden="true" />
                    </Button>
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

      <RfCalculationRunDetailDrawer
        open={selectedCalculationRunId !== null}
        calculationRunId={selectedCalculationRunId}
        onApplied={onApplied}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedCalculationRunId(null);
          }
        }}
      />
    </section>
  );
}
