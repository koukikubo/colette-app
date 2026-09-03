"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage?: number;
  perPageOptions?: readonly number[];
  className?: string;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

// 一覧画面で共通利用するページ移動と件数表示を提供する。
export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  perPage,
  perPageOptions = [20, 50, 100],
  className,
  onPageChange,
  onPerPageChange,
}: PaginationControlsProps) {
  // 一覧が空の場合はページ操作を表示しない。
  if (totalCount === 0) {
    return null;
  }

  const canMovePrevious = currentPage > 1;
  const canMoveNext = currentPage < totalPages;

  return (
    <nav
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label="ページネーション"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          全{totalCount}件・{currentPage} / {totalPages}ページ
        </p>

        {perPage !== undefined && onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">表示件数</span>

            <Select
              value={String(perPage)}
              onValueChange={(value) => onPerPageChange(Number(value))}
            >
              <SelectTrigger size="sm" aria-label="1ページあたりの表示件数">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}件
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canMovePrevious}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
          前へ
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!canMoveNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          次へ
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
