"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type CustomerVisitFilters,
  type CustomerListParams,
  type CustomerRfState,
  type CustomerRfReference,
} from "../../types";
import type { CustomerKind, CustomerVisibility } from "../../types";

export type CustomerFilterValues = CustomerVisitFilters & {
  customerRankId?: CustomerListParams["customer_rank_id"];
  rfRankId?: number;
  rfRankState?: CustomerRfState;
  visibility: CustomerVisibility;
  customerKind?: CustomerKind;
};

type CustomerFilterPopoverProps = {
  visitFilters?: CustomerVisitFilters;
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
  visitFilters = {},
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
  function visitDraft() {
    return {
      last_visit_from: visitFilters.last_visit_from ?? "",
      last_visit_to: visitFilters.last_visit_to ?? "",
      min_visits: String(visitFilters.min_visits ?? ""),
      max_visits: String(visitFilters.max_visits ?? ""),
    };
  }
  const [draftVisits, setDraftVisits] = useState(visitDraft);
  const invalidVisits =
    (draftVisits.last_visit_from &&
      draftVisits.last_visit_to &&
      draftVisits.last_visit_from > draftVisits.last_visit_to) ||
    [draftVisits.min_visits, draftVisits.max_visits].some(
      (value) => value !== "" && !/^\d{1,6}$/.test(value),
    ) ||
    (draftVisits.min_visits !== "" &&
      draftVisits.max_visits !== "" &&
      Number(draftVisits.min_visits) > Number(draftVisits.max_visits));

  const [draftVisibility, setDraftVisibility] =
    useState<CustomerVisibility>(visibility);

  const [draftCustomerKind, setDraftCustomerKind] =
    useState<CustomerKindFilter>(customerKind ?? "all");

  const [draftRank, setDraftRank] = useState(String(customerRankId ?? "all"));

  const [draftRfRank, setDraftRfRank] = useState(String(rfRankId ?? "all"));
  const [draftRfState, setDraftRfState] = useState<CustomerRfState | "all">(
    rfRankState ?? "all",
  );
  const activeFilterCount =
    Number(customerRankId !== undefined) +
    Number(rfRankId !== undefined || rfRankState !== undefined) +
    Number(visibility !== "visible") +
    Number(customerKind !== undefined) +
    (
      ["last_visit_from", "last_visit_to", "min_visits", "max_visits"] as const
    ).filter(
      (key) => visitFilters[key] !== undefined && visitFilters[key] !== "",
    ).length;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftVisits(visitDraft());
      setDraftVisibility(visibility);
      setDraftRank(String(customerRankId ?? "all"));
      setDraftRfRank(String(rfRankId ?? "all"));
      setDraftRfState(rfRankState ?? "all");
      setDraftCustomerKind(customerKind ?? "all");
    }

    setOpen(nextOpen);
    rankOptions.onOpenChange(nextOpen);
  }

  function handleReset() {
    setDraftVisits({
      last_visit_from: "",
      last_visit_to: "",
      min_visits: "",
      max_visits: "",
    });
    setDraftVisibility("visible");
    setDraftRank("all");
    setDraftRfRank("all");
    setDraftRfState("all");
    setDraftCustomerKind("all");
  }

  function handleApply() {
    if (invalidVisits) return;
    onApply({
      last_visit_from: draftVisits.last_visit_from || undefined,
      last_visit_to: draftVisits.last_visit_to || undefined,
      min_visits:
        draftVisits.min_visits === ""
          ? undefined
          : Number(draftVisits.min_visits),
      max_visits:
        draftVisits.max_visits === ""
          ? undefined
          : Number(draftVisits.max_visits),
      visibility: draftVisibility,
      // ランクと計算状態は別の概念。既存APIの排他契約は選択時に維持する。
      rfRankId: draftRfRank === "all" ? undefined : Number(draftRfRank),
      rfRankState: draftRfState === "all" ? undefined : draftRfState,
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
        className="flex max-h-[min(80vh,var(--radix-popover-content-available-height))] w-[28rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0"
        align="end"
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <h3 className="font-semibold">詳細条件</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              異なる条件はすべて満たす顧客を表示します。
            </p>
          </div>
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
                <RadioGroupItem
                  id="customer-kind-corporate"
                  value="corporate"
                />
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
              value={draftRfRank}
              onChange={(event) => {
                setDraftRfRank(event.target.value);
                if (event.target.value !== "all") setDraftRfState("all");
              }}
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
            </select>
            {rfReference?.base_date && (
              <p className="text-xs text-muted-foreground">
                計算基準日：{rfReference.base_date}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-rf-state-filter">RF計算状態</Label>
            <select
              id="customer-rf-state-filter"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draftRfState}
              aria-describedby="customer-rf-condition-help"
              onChange={(event) => {
                setDraftRfState(event.target.value as CustomerRfState | "all");
                if (event.target.value !== "all") setDraftRfRank("all");
              }}
            >
              <option value="all">すべて</option>
              {/* 過去のURLは復元できるが、未訪問の新規検索はランク欄へ集約する。 */}
              {draftRfState === "no_visit" && (
                <option value="no_visit">来店履歴なし（旧検索条件）</option>
              )}
              {Object.entries(CUSTOMER_RF_STATES)
                .filter(([state]) => state !== "no_visit")
                .map(([state, label]) => (
                  <option key={state} value={state}>
                    {label}
                  </option>
                ))}
            </select>
            <p
              id="customer-rf-condition-help"
              className="text-xs text-muted-foreground"
            >
              RFランクとRF計算状態はどちらか一方で検索します。選択すると他方は「すべて」に戻ります。
              「来店履歴なし」はRFランクから選択してください。
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">来店実績で絞り込む</legend>
            <p className="text-xs text-muted-foreground">
              最終来店日は全期間、回数は直近12か月の退店済み予約が対象です。
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["last_visit_from", "最終来店日（開始）", "date"],
                  ["last_visit_to", "最終来店日（終了）", "date"],
                  ["min_visits", "来店回数（最小）", "number"],
                  ["max_visits", "来店回数（最大）", "number"],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key} className="min-w-0 space-y-1.5">
                  <Label htmlFor={`visit-${key}`}>{label}</Label>
                  <Input
                    id={`visit-${key}`}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    max={type === "number" ? 999999 : undefined}
                    value={draftVisits[key]}
                    onChange={(event) =>
                      setDraftVisits((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(invalidVisits)}
                  />
                </div>
              ))}
            </div>
            {invalidVisits && (
              <p role="alert" className="text-sm text-destructive">
                日付・回数の範囲を確認してください。回数は0以上の整数で、最小値は最大値以下です。
              </p>
            )}
          </fieldset>
        </div>
        {/* 条件だけをスクロールし、狭い画面でも適用・リセットを常に操作できる。 */}
        <div className="flex shrink-0 justify-end gap-2 bg-popover px-4 pb-4 pt-3">
          <Button type="button" variant="ghost" onClick={handleReset}>
            リセット
          </Button>

          <Button
            type="button"
            disabled={Boolean(invalidVisits)}
            onClick={handleApply}
          >
            適用
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
