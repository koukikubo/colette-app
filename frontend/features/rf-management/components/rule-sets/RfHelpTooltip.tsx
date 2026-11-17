"use client";

import type { ReactNode } from "react";
import { CircleHelpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RfHelpTooltipProps = {
  label: string;
  children: ReactNode;
};

export function RfHelpTooltip({ label, children }: RfHelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground"
            aria-label={`${label}の説明`}
          >
            <CircleHelpIcon aria-hidden="true" />
          </Button>
        </TooltipTrigger>

        <TooltipContent sideOffset={6}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
