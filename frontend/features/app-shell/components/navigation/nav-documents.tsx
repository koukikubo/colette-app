"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavDocumentItem = {
  name: string;
  url: string;
  icon: React.ReactNode;
};

type NavDocumentsProps = {
  /**
   * サイドバー内のグループ見出し。
   *
   * 例:
   * - 管理メニュー
   * - 検索
   * - ドキュメント
   */
  title: string;

  /**
   * グループ内に表示するメニュー一覧。
   */
  items: NavDocumentItem[];
};

export function NavDocuments({ title, items }: NavDocumentsProps) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild isActive={pathname === item.url}>
              <Link
                href={item.url}
                aria-current={pathname === item.url ? "page" : undefined}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
