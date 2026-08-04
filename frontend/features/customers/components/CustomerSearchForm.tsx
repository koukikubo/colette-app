"use client";

// import { type FormEvent, useState } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomerKind, CustomerVisibility } from "../types";

import { CustomerFilterPopover } from "./CustomerFilterPopover";
import type { CustomerFilterValues } from "./CustomerFilterPopover";
import { CustomerKeywordSearch } from "./CustomerKeywordSearch";

type CustomerSearchFormProps = {
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
  value,
  hasAppliedQuery,
  visibility,
  customerKind,
  isLoading = false,
  onValueChange,
  onSearch,
  onClear,
  onApplyFilters,
}: CustomerSearchFormProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="flex gap-2">
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
          visibility={visibility}
          customerKind={customerKind}
          isLoading={isLoading}
          onApply={onApplyFilters}
        />
      </div>
    </div>
  );
}
