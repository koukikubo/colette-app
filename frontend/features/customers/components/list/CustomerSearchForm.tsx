"use client";

// import { type FormEvent, useState } from "react";
import type { CustomerRankOptions } from "../../hooks/useCustomerRankOptions";
import type {
  CustomerVisitFilters,
  CustomerListParams,
  CustomerRfState,
  CustomerRfReference,
} from "../../types";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomerKind, CustomerVisibility } from "../../types";

import { CustomerFilterPopover } from "./CustomerFilterPopover";
import type { CustomerFilterValues } from "./CustomerFilterPopover";
import { CustomerKeywordSearch } from "../search/CustomerKeywordSearch";

type CustomerSearchFormProps = {
  visitFilters?: CustomerVisitFilters;
  customerRankId?: CustomerListParams["customer_rank_id"];
  rankOptions: CustomerRankOptions;
  rfRankId?: number;
  rfRankState?: CustomerRfState;
  rfReference?: CustomerRfReference | null;
  initialQuery?: string;
  isLoading?: boolean;
  value: string;
  hasAppliedQuery: boolean;
  visibility: CustomerVisibility;
  customerKind?: CustomerKind;
  onSearch: () => void;
  onValueChange: (value: string) => void;
  onClear: () => void;
  onApplyFilters: (filters: CustomerFilterValues) => void;
};

export function CustomerSearchForm({
  visitFilters,
  value,
  hasAppliedQuery,
  visibility,
  customerKind,
  customerRankId,
  rankOptions,
  rfRankId,
  rfRankState,
  rfReference,
  isLoading = false,
  onValueChange,
  onSearch,
  onClear,
  onApplyFilters,
}: CustomerSearchFormProps) {
  return (
    <div className="w-full xl:max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <CustomerKeywordSearch
          value={value}
          isLoading={isLoading}
          onValueChange={onValueChange}
          onSearch={onSearch}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || (value.length === 0 && !hasAppliedQuery)}
          onClick={onClear}
        >
          <XIcon />
          クリア
        </Button>

        <CustomerFilterPopover
          visitFilters={visitFilters}
          visibility={visibility}
          customerKind={customerKind}
          customerRankId={customerRankId}
          rankOptions={rankOptions}
          rfRankId={rfRankId}
          rfRankState={rfRankState}
          rfReference={rfReference}
          isLoading={isLoading}
          onApply={onApplyFilters}
        />
      </div>
    </div>
  );
}
