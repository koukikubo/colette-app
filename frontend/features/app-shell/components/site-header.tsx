"use client";

import { usePathname } from "next/navigation";

import { HelpButton } from "@/features/help/components/HelpButton";
import { Brand } from "./brand";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { resolveHeaderLocation } from "./page-location";

export function SiteHeader() {
  const pathname = usePathname();
  const location = resolveHeaderLocation(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center bg-card">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger
          className="-ml-1"
          data-guide-target="navigation"
          aria-label="メニューを開閉"
          title="メニューを開閉"
        />
        <div className="mr-2 shrink-0 sm:mr-6">
          <Brand authenticated />
        </div>
        <nav
          aria-label="現在地"
          className="flex min-w-0 items-center gap-2 text-sm sm:text-base"
        >
          <span
            aria-current={!location.page ? "page" : undefined}
            title={location.section}
            className="min-w-0 truncate text-muted-foreground"
          >
            {location.section}
          </span>
          {location.page && (
            <>
              <span className="text-muted-foreground/60" aria-hidden="true">
                /
              </span>
              <span aria-current="page" className="truncate font-medium">
                {location.page}
              </span>
            </>
          )}
        </nav>
        <div className="ml-auto shrink-0">
          <HelpButton />
        </div>
      </div>
    </header>
  );
}
