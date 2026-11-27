"use client";

import { AppSidebar } from "@/features/app-shell/components/app-sidebar";
import { SiteHeader } from "@/features/app-shell/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/common/page-heading";
import {
  resolveHeaderLocation,
  pageSuppliesHeading,
} from "@/features/app-shell/components/page-location";
import { useEffect } from "react";

type ReservationsLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: ReservationsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const location = resolveHeaderLocation(pathname);
  const { status, refreshCurrentStaff } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        `/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  }, [status, router]);

  if (status === "error")
    return (
      <div role="alert" className="p-6">
        認証状態を確認できませんでした。
        <Button
          variant="outline"
          onClick={() => void refreshCurrentStaff().catch(() => undefined)}
        >
          再取得
        </Button>
      </div>
    );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">認証状態を確認中です...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">
          ログイン画面へ移動しています...
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        className="flex-col"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        {/* ブランドと現在地は、サイドバーの開閉によらず画面左上に固定する。 */}
        <SiteHeader />
        <div className="flex min-w-0 flex-1">
          <AppSidebar
            variant="sidebar"
            className="top-(--header-height) h-[calc(100svh-var(--header-height))] border-none!"
          />
          <SidebarInset id="main-content" tabIndex={-1} className="min-w-0">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3"
            >
              本文へ移動
            </a>
            <div className="min-w-0">
              {!pageSuppliesHeading(pathname) && (
                <PageHeading>
                  {location.page
                    ? `${location.section} / ${location.page}`
                    : location.section}
                </PageHeading>
              )}
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
