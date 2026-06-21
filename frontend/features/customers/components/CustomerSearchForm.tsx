"use client";

import { type FormEvent, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CustomerSearchFormProps = {
  initialQuery?: string;
  isLoading?: boolean;
  onSearch: (query: string) => void;
};

export function CustomerSearchForm({
  initialQuery = "",
  isLoading = false,
  onSearch,
}: CustomerSearchFormProps) {
  const [inputValue, setInputValue] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSearch(inputValue.trim());
  }

  function handleClear() {
    setInputValue("");
    onSearch("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <div className="flex-1">
        <Input
          type="search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
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
          disabled={isLoading || inputValue.length === 0}
          onClick={handleClear}
        >
          <XIcon />
          クリア
        </Button>
      </div>
    </form>
  );
}
