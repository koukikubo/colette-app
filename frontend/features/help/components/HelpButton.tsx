"use client";
import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { guideForPath } from "../guide-catalog";

export const OPEN_HELP_EVENT = "colette:open-help";
// 入力画面から移動せず、同じ画面の説明を開く。フォーカスの戻り先も渡す。
export function HelpButton() {
  const guide = guideForPath(usePathname());
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="使い方・ヘルプ"
            data-guide-target="help"
            onClick={(event) =>
              window.dispatchEvent(
                new CustomEvent(OPEN_HELP_EVENT, {
                  detail: { trigger: event.currentTarget },
                }),
              )
            }
          >
            <CircleHelp aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">
          {guide?.summary ?? "この画面と全機能の使い方を確認できます。"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
