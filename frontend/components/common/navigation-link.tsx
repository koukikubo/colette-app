import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationLinkProps = ComponentProps<typeof Link> & {
  variant?: "secondary" | "outline" | "ghost";
};

// ボタンと同じトークンを使いながら、遷移はアンカーの意味・操作を保持する。
export function NavigationLink({
  className,
  variant = "secondary",
  ...props
}: NavigationLinkProps) {
  return (
    <Link
      {...props}
      data-slot="navigation-link"
      className={cn(
        buttonVariants({ variant, size: "sm" }),
        "h-auto min-h-8 max-w-full whitespace-normal py-1 text-left [overflow-wrap:anywhere]",
        className,
      )}
    />
  );
}
