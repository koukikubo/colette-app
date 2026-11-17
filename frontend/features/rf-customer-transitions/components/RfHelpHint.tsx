/**
 * RF画面の補足説明を、必要なときだけ確認できるヒントとして表示する。
 *
 * マウスホバー・キーボードフォーカスで開き、
 * タッチ操作ではボタンのタップでも開閉できる。
 */
"use client";

import { useState, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  label: string;
  children: ReactNode;
};

/**
 * 操作対象を示す読み上げラベルと、補足説明を受け取る。
 * 開閉状態は各ヒント内で管理し、ほかのヒントへ影響させない。
 */
export function RfHelpHint({ label, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-4 items-center justify-center rounded-full border text-xs font-semibold"
            >
              ?
            </span>
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-80 p-3 text-left text-xs leading-relaxed"
        >
          <div className="space-y-2">{children}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
