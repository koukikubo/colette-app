"use client";

// RFランク低下顧客の一覧画面。
// useRfRankDropsで取得し、共通のページ操作と顧客詳細へのリンクを表示する。

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";

import { useRfRankDrops } from "../hooks/useRfRankDrops";
import type {
  RfRankDropLatestState,
  RfRankDropParams,
  RfRankDropUnavailableState,
} from "../types/rf-rank-drop";

// 比較できない理由を、画面に表示する文章へ対応付ける。
const UNAVAILABLE_MESSAGES: Record<RfRankDropUnavailableState, string> = {
  no_current_run: "現在適用中のRF計算結果がありません。",
  no_history_in_period: "対象期間内に計算履歴がありません。",
  no_previous_run: "比較する前の計算履歴がありません。",
  no_comparable_history:
    "RFルールの違いなどにより、対象期間の履歴を比較できません。",
};

// 現在の状態が通常ランク以外だった場合の表示名。
const LATEST_STATE_LABELS: Record<RfRankDropLatestState, string> = {
  ranked: "通常ランク",
  missing: "記録なし",
  excluded: "計算対象外",
  unmatched: "未分類",
  no_visit: "来店履歴なし",
};

/**
 * 一覧の条件・ページ操作を管理し、取得結果を表示する。
 * 顧客名のリンクは既存の顧客詳細ページへ接続する。
 */
export function RfRankDropListPageClient() {
  const [startDateInput, setStartDateInput] = useState<string | null>(null);
  const [endDateInput, setEndDateInput] = useState<string | null>(null);
  const [period, setPeriod] = useState<
    Pick<RfRankDropParams, "start_date" | "end_date">
  >({});
  const [reloadKey, setReloadKey] = useState(0);

  const { currentPage, perPage, setCurrentPage, setPerPage, resetPage } =
    usePagination();

  const { data, isLoading, errorMessage } = useRfRankDrops({
    ...period,
    page: currentPage,
    // 共通Hookのnumber型を、APIで許可している表示件数へ絞り込む。
    per_page: perPage === 50 || perPage === 100 ? perPage : 20,
    reloadKey,
  });

  /**
   * 入力した期間を取得条件へ反映する。
   * 条件が変わるため1ページ目へ戻し、同じ条件でも再取得する。
   */
  function handleApplyPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetPage();

    setPeriod({
      start_date: (startDateInput ?? data?.start_date) || undefined,
      end_date: (endDateInput ?? data?.end_date) || undefined,
    });

    setReloadKey((current) => current + 1);
  }

  /**
   * 期間指定を解除し、バックエンドの初期期間で取得する。
   * 初期期間は当月初日から今日まで。
   */
  function handleResetPeriod() {
    setStartDateInput(null);
    setEndDateInput(null);
    setPeriod({});
    resetPage();
    setReloadKey((current) => current + 1);
  }

  /**
   * PaginationControlsから通知された表示件数を反映する。
   * 顧客一覧と同じ20・50・100件を許可し、1ページ目へ戻す。
   */
  function handlePerPageChange(nextPerPage: number) {
    if (nextPerPage !== 20 && nextPerPage !== 50 && nextPerPage !== 100) {
      return;
    }

    resetPage();
    setPerPage(nextPerPage);
  }

  // 現在の期間・ページを維持したまま、取得Hookを再実行する。
  function handleRetry() {
    setReloadKey((current) => current + 1);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex gap-4">
        <span>低下済み</span>
        <Link className="underline" href="/rf-rank-drops/predictions">
          低下予定
        </Link>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">RFランク低下顧客</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          対象期間内にランクが低下した顧客を確認できます。
        </p>
      </header>

      <section
        className="rounded-lg border bg-card p-4"
        aria-label="対象期間の指定"
      >
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={handleApplyPeriod}
        >
          <div className="space-y-2">
            <Label htmlFor="rank-drop-start-date">開始日</Label>
            <Input
              id="rank-drop-start-date"
              type="date"
              value={startDateInput ?? data?.start_date ?? ""}
              max={(endDateInput ?? data?.end_date) || undefined}
              onChange={(event) => setStartDateInput(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank-drop-end-date">終了日</Label>
            <Input
              id="rank-drop-end-date"
              type="date"
              value={endDateInput ?? data?.end_date ?? ""}
              min={(startDateInput ?? data?.start_date) || undefined}
              onChange={(event) => setEndDateInput(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            表示する
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleResetPeriod}
          >
            当月に戻す
          </Button>
        </form>
      </section>

      {isLoading && (
        <p role="status" className="py-8 text-center text-muted-foreground">
          読み込み中です。
        </p>
      )}

      {!isLoading && errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>一覧を取得できませんでした</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={handleRetry}
            >
              再読み込み
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              対象期間：{data.start_date} ～ {data.end_date}
            </p>
            {data.current_run && (
              <p className="text-muted-foreground">
                現在のランクの計算基準日：{data.current_run.base_date}
              </p>
            )}
          </div>

          {data.skipped_comparisons.length > 0 && (
            <Alert>
              <AlertTitle>比較できなかった履歴があります</AlertTitle>
              <AlertDescription>
                {data.skipped_comparisons.length}件の履歴は、比較元がない、
                RFルールが異なる、基準日の順序が逆などの理由で、
                比較に含まれていません。
              </AlertDescription>
            </Alert>
          )}

          {data.state !== "ready" ? (
            <p
              role="status"
              className="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
            >
              {UNAVAILABLE_MESSAGES[data.state]}
            </p>
          ) : (
            <>
              <p className="text-sm">
                対象顧客：
                <span className="ml-1 text-lg font-semibold tabular-nums">
                  {data.pagination.total_count.toLocaleString("ja-JP")}
                </span>
                人
              </p>

              {data.pagination.total_count === 0 ? (
                <p
                  role="status"
                  className="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
                >
                  対象期間内にランクが低下した顧客はいません。
                </p>
              ) : (
                <>
                  <div className="rounded-lg border">
                    <Table>
                      <TableCaption className="sr-only">
                        対象期間内にRFランクが低下した顧客一覧
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>顧客名</TableHead>
                          <TableHead>低下を検出した基準日</TableHead>
                          <TableHead>低下前</TableHead>
                          <TableHead>低下時</TableHead>
                          <TableHead>現在のランク・状態</TableHead>
                          <TableHead>最終来店日</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.customers.map((customer) => (
                          <TableRow key={customer.customer_id}>
                            <TableCell>
                              <Link
                                href={`/customers/${customer.customer_id}`}
                                className="font-medium underline underline-offset-4 hover:text-primary"
                              >
                                {customer.customer_name}
                              </Link>
                            </TableCell>
                            <TableCell>{customer.detected_on}</TableCell>
                            <TableCell>
                              {customer.previous_rank.label}
                            </TableCell>
                            <TableCell>{customer.dropped_rank.label}</TableCell>
                            <TableCell>
                              {customer.latest_state === "ranked"
                                ? (customer.latest_rank?.label ?? "記録なし")
                                : LATEST_STATE_LABELS[customer.latest_state]}
                            </TableCell>
                            <TableCell>
                              {customer.last_visit_on ?? "来店履歴なし"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationControls
                    currentPage={data.pagination.current_page}
                    totalPages={data.pagination.total_pages}
                    totalCount={data.pagination.total_count}
                    perPage={perPage}
                    onPageChange={setCurrentPage}
                    onPerPageChange={handlePerPageChange}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
