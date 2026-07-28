"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CustomerKeywordSearchProps = {
  value: string;
  isLoading?: boolean;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
};

export function CustomerKeywordSearch({
  value,
  isLoading = false,
  placeholder = "氏名・カナ・電話番号・メール・法人名で検索",
  onValueChange,
  onSearch,
}: CustomerKeywordSearchProps) {
  return (
    <div className="flex flex-1 gap-2">
      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label="顧客検索キーワード"
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSearch();
          }
        }}
      />

      <Button type="button" disabled={isLoading} onClick={onSearch}>
        <SearchIcon />
        {isLoading ? "検索中…" : "検索"}
      </Button>
    </div>
  );
}
