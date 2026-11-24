"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CUSTOMER_RF_STATES, type CustomerListParams } from "../../types";

type CustomerActiveFiltersProps = {
  filters: CustomerListParams;
  customerRankLabel?: string;
  rfRankLabel?: string;
  onClearVisits: () => void;
  onClearRf: () => void;
  onClearCustomerRank: () => void;
  onClearQuery: () => void;
  onResetVisibility: () => void;
  onClearCustomerKind: () => void;
  onClearAll: () => void;
};

export function CustomerActiveFilters({
  filters,
  customerRankLabel,
  rfRankLabel,
  onClearVisits,
  onClearRf,
  onClearCustomerRank,
  onClearQuery,
  onResetVisibility,
  onClearCustomerKind,
  onClearAll,
}: CustomerActiveFiltersProps) {
  const visibility = filters.visibility ?? "visible";

  const hasActiveFilters =
    filters.customer_rank_id !== undefined ||
    filters.rf_rank_id !== undefined ||
    filters.rf_rank_state !== undefined ||
    Boolean(filters.query) ||
    visibility !== "visible" ||
    Boolean(filters.customer_kind) ||
    Boolean(filters.last_visit_from || filters.last_visit_to) ||
    filters.min_visits !== undefined ||
    filters.max_visits !== undefined;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">適用中:</span>

      {filters.customer_rank_id !== undefined && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          size="sm"
          onClick={onClearCustomerRank}
        >
          手動ランク:{" "}
          {filters.customer_rank_id === "unassigned"
            ? "未設定"
            : (customerRankLabel ?? "選択中")}
          <XIcon className="size-3.5" />
        </Button>
      )}

      {(filters.rf_rank_id !== undefined || filters.rf_rank_state) && (
        <Button type="button" variant="secondary" size="sm" onClick={onClearRf}>
          {filters.rf_rank_state ? "RF計算状態" : "RFランク"}:{" "}
          {filters.rf_rank_state
            ? CUSTOMER_RF_STATES[filters.rf_rank_state]
            : (rfRankLabel ?? "選択中")}
          <XIcon className="size-3.5" />
        </Button>
      )}

      {(filters.last_visit_from ||
        filters.last_visit_to ||
        filters.min_visits !== undefined ||
        filters.max_visits !== undefined) && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          aria-label="来店条件を解除"
          onClick={onClearVisits}
        >
          来店条件：{filters.last_visit_from || "指定なし"}〜
          {filters.last_visit_to || "指定なし"}／{filters.min_visits ?? 0}〜
          {filters.max_visits ?? "上限なし"}回
          <XIcon className="size-3.5 shrink-0" />
        </Button>
      )}
      {filters.query && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          size="sm"
          onClick={onClearQuery}
        >
          キーワード: {filters.query}
          <XIcon className="size-3.5" />
        </Button>
      )}

      {visibility === "hidden" && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          size="sm"
          onClick={onResetVisibility}
        >
          非表示
          <XIcon className="size-3.5" />
        </Button>
      )}

      {visibility === "all" && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          size="sm"
          onClick={onResetVisibility}
        >
          表示状態: すべて
          <XIcon className="size-3.5" />
        </Button>
      )}

      {filters.customer_kind && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto max-w-full whitespace-normal wrap-anywhere"
          size="sm"
          onClick={onClearCustomerKind}
        >
          {filters.customer_kind === "individual" ? "個人" : "法人"}
          <XIcon className="size-3.5" />
        </Button>
      )}

      <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
        すべて解除
      </Button>
    </div>
  );
}
