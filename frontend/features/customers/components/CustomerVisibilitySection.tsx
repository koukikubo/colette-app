"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Customer } from "../types";

type CustomerVisibilitySectionProps = {
  customer: Customer;
  allowVisibilityChange: boolean;
  disabled?: boolean;
  onRequestChange: () => void;
};

export function CustomerVisibilitySection({
  customer,
  allowVisibilityChange,
  disabled = false,
  onRequestChange,
}: CustomerVisibilitySectionProps) {
  const isHidden = customer.hidden;
  const operationDisabled = disabled || !allowVisibilityChange;

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">表示状態</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          通常の顧客一覧に表示するかどうかを設定します。
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isHidden ? (
              <EyeOffIcon className="size-4 text-muted-foreground" />
            ) : (
              <EyeIcon className="size-4" />
            )}

            <span className="text-sm font-medium">
              現在：
              {isHidden ? "非表示" : "表示中"}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {isHidden
              ? "通常の顧客一覧には表示されていません。"
              : "通常の顧客一覧に表示されています。"}
          </p>
        </div>

        <Button
          type="button"
          variant={isHidden ? "outline" : "destructive"}
          disabled={operationDisabled}
          onClick={onRequestChange}
        >
          {isHidden ? "顧客を復帰する" : "顧客を非表示にする"}
        </Button>
      </div>

      {!allowVisibilityChange && (
        <p className="text-sm text-muted-foreground">
          非表示・復帰の設定は、顧客詳細画面から編集してください。
        </p>
      )}
    </section>
  );
}
