"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { CustomerRankOptions } from "../../hooks/useCustomerRankOptions";
import {
  CUSTOMER_RF_STATES,
  type CustomerListParams,
  type CustomerRfState,
  type CustomerRfReference,
} from "../../types";
import type { CustomerKind, CustomerVisibility } from "../../types";

export type CustomerFilterValues = {
  customerRankId?: CustomerListParams["customer_rank_id"];
  rfRankId?: number;
  rfRankState?: CustomerRfState;
  visibility: CustomerVisibility;
  customerKind?: CustomerKind;
};

type CustomerFilterPopoverProps = {
  customerRankId?: CustomerListParams["customer_rank_id"];
  rfRankId?: number;
  rfRankState?: CustomerRfState;
  rankOptions: CustomerRankOptions;
  rfReference?: CustomerRfReference | null;
  visibility: CustomerVisibility;
  customerKind?: CustomerKind;
  isLoading?: boolean;
  onApply: (filters: CustomerFilterValues) => void;
};

type CustomerKindFilter = CustomerKind | "all";

export function CustomerFilterPopover({
  visibility,
  customerKind,
  customerRankId,
  rankOptions,
  rfRankId,
  rfRankState,
  rfReference,
  isLoading = false,
  onApply,
}: CustomerFilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const [draftVisibility, setDraftVisibility] =
    useState<CustomerVisibility>(visibility);

  const [draftCustomerKind, setDraftCustomerKind] =
    useState<CustomerKindFilter>(customerKind ?? "all");

  const [draftRank, setDraftRank] = useState(String(customerRankId ?? "all"));

  const rfValue =
    rfRankId !== undefined
      ? String(rfRankId)
      : rfRankState
        ? `state:${rfRankState}`
        : "all";
  const [draftRf, setDraftRf] = useState(rfValue);
  const activeFilterCount =
    Number(customerRankId !== undefined) +
    Number(rfRankId !== undefined || rfRankState !== undefined) +
    Number(visibility !== "visible") +
    Number(customerKind !== undefined);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftVisibility(visibility);
      setDraftRank(String(customerRankId ?? "all"));
      setDraftRf(rfValue);
      setDraftCustomerKind(customerKind ?? "all");
    }

    setOpen(nextOpen);
    rankOptions.onOpenChange(nextOpen);
  }

  function handleReset() {
    setDraftVisibility("visible");
    setDraftRank("all");
    setDraftRf("all");
    setDraftCustomerKind("all");
  }

  function handleApply() {
    onApply({
      visibility: draftVisibility,
      // 1つの選択欄でランクIDと分類を排他的に扱い、矛盾した検索を作らない。
      rfRankId:
        draftRf !== "all" && !draftRf.startsWith("state:")
          ? Number(draftRf)
          : undefined,
      rfRankState: draftRf.startsWith("state:")
        ? (draftRf.slice(6) as CustomerRfState)
        : undefined,
      customerRankId:
        draftRank === "all"
          ? undefined
          : draftRank === "unassigned"
            ? "unassigned"
            : Number(draftRank),
      customerKind: draftCustomerKind === "all" ? undefined : draftCustomerKind,
    });

    handleOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={isLoading}>
          <SlidersHorizontalIcon />
          絞り込み
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="max-h-[80vh] w-80 max-w-[calc(100vw-2rem)] space-y-5 overflow-y-auto"
        align="end"
      >
        <div className="space-y-3">
          <div>
            <p className="font-medium">表示状態</p>
            <p className="text-sm text-muted-foreground">
              顧客の表示状態を選択します。
            </p>
          </div>

          <RadioGroup
            value={draftVisibility}
            onValueChange={(value) =>
              setDraftVisibility(value as CustomerVisibility)
            }
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="visibility-visible" value="visible" />
              <Label htmlFor="visibility-visible">表示中</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem id="visibility-hidden" value="hidden" />
              <Label htmlFor="visibility-hidden">非表示</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem id="visibility-all" value="all" />
              <Label htmlFor="visibility-all">すべて</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium">顧客区分</p>
            <p className="text-sm text-muted-foreground">
              個人または法人で絞り込みます。
            </p>
          </div>

          <RadioGroup
            value={draftCustomerKind}
            onValueChange={(value) =>
              setDraftCustomerKind(value as CustomerKindFilter)
            }
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="customer-kind-all" value="all" />
              <Label htmlFor="customer-kind-all">すべて</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem
                id="customer-kind-individual"
                value="individual"
              />
              <Label htmlFor="customer-kind-individual">個人</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem id="customer-kind-corporate" value="corporate" />
              <Label htmlFor="customer-kind-corporate">法人</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-rank-filter">手動設定の顧客ランク</Label>
          <select
            id="customer-rank-filter"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftRank}
            disabled={rankOptions.loading}
            onChange={(event) => setDraftRank(event.target.value)}
          >
            <option value="all">すべて</option>
            <option value="unassigned">未設定</option>
            {customerRankId !== undefined &&
              customerRankId !== "unassigned" &&
              !rankOptions.options.some(
                (option) => option.id === customerRankId,
              ) && <option value={customerRankId}>現在の検索条件</option>}
            {rankOptions.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
                {option.active ? "" : "（無効）"}
              </option>
            ))}
          </select>
          {rankOptions.loading && (
            <p role="status" className="text-sm">
              選択肢を取得中です…
            </p>
          )}
          {rankOptions.error && (
            <div role="alert" className="text-sm text-destructive">
              <p>{rankOptions.error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={rankOptions.retry}
              >
                選択肢を再取得
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-rf-filter">現在適用中のRFランク</Label>
          <select
            id="customer-rf-filter"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftRf}
            onChange={(event) => setDraftRf(event.target.value)}
          >
            <option value="all">すべて</option>
            {rfRankId !== undefined &&
              !rfReference?.ranks.some((rank) => rank.id === rfRankId) && (
                <option value={rfRankId}>現在の検索条件</option>
              )}
            {(rfReference?.ranks ?? []).map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.label}
              </option>
            ))}
            {Object.entries(CUSTOMER_RF_STATES).map(([state, label]) => (
              <option key={state} value={`state:${state}`}>
                {label}
              </option>
            ))}
          </select>
          {rfReference?.base_date && (
            <p className="text-xs text-muted-foreground">
              計算基準日：{rfReference.base_date}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleReset}>
            リセット
          </Button>

          <Button type="button" onClick={handleApply}>
            適用
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
