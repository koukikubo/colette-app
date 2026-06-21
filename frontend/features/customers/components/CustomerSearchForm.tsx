"use client";

// import { type FormEvent, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { CustomerKind, CustomerVisibility } from "../types";

import {
  CustomerFilterPopover,
  CustomerFilterValues,
} from "./CustomerFilterPopover";
import { FormEvent } from "react";

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
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }
  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <div className="flex-1">
        <Input
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="氏名・カナ・電話番号・メール・法人名で検索"
          aria-label="顧客検索キーワード"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          <SearchIcon />
          検索
        </Button>

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
    </form>
  );
}
