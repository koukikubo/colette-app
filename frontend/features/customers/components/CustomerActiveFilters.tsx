"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomerListParams } from "../types";

type CustomerActiveFiltersProps = {
  filters: CustomerListParams;
  onClearQuery: () => void;
  onResetVisibility: () => void;
  onClearCustomerKind: () => void;
  onClearAll: () => void;
};

export function CustomerActiveFilters({
  filters,
  onClearQuery,
  onResetVisibility,
  onClearCustomerKind,
  onClearAll,
}: CustomerActiveFiltersProps) {
  const visibility = filters.visibility ?? "visible";

  const hasActiveFilters =
    Boolean(filters.query) ||
    visibility !== "visible" ||
    Boolean(filters.customer_kind);

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">適用中:</span>

      {filters.query && (
        <Button
          type="button"
          variant="secondary"
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
