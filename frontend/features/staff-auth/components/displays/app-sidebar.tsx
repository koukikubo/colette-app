"use client";

import * as React from "react";
import Link from "next/link";

import {
  Armchair,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  NotebookPenIcon,
  SearchIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "User Name",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  /**
   * メインメニュー。
   *
   * 普段の業務でよく使う画面をここに置きます。
   */
  navMain: [
    {
      title: "ダッシュボード",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    // {
    //   title: "予約一覧",
    //   url: "/reservation",
    //   icon: <CalendarDaysIcon />,
    // },
    {
      title: "顧客管理",
      url: "/customers",
      icon: <UsersIcon />,
    },
    {
      title: "予約管理",
      url: "/reservations",
      icon: <CalendarDaysIcon />,
    },
    {
      title: "お知らせ",
      url: "/announcements",
      icon: <MegaphoneIcon />,
    },
    {
      title: "顧客ノート",
      url: "/customer-notes",
      icon: <NotebookPenIcon />,
    },
  ],

  /**
   * 管理メニュー。
   *
   * マスタ系の画面をここにまとめます。
   * 今回の Issue 37 の画面はここに配置します。
   */
  masterMenu: [
    {
      name: "基本コード・選択肢コード",
      url: "/standard-codes",
      icon: <SettingsIcon />,
    },
    {
      name: "担当者マスタ",
      url: "/staff-masters",
      icon: <UserRoundIcon />,
    },
    {
      name: "予約テーブルマスタ",
      url: "/restaurant-masters",
      icon: <Armchair />,
    },
  ],

  /**
   * 検索メニュー。
   *
   * 顧客検索・予約検索など、
   * 将来的に検索専用画面を作る場合はここに置きます。
   */
  searchMenu: [
    {
      name: "顧客検索",
      url: "/customers/search",
      icon: <SearchIcon />,
    },
    {
      name: "予約検索",
      url: "/reservations/search",
      icon: <SearchIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <span className="text-base font-semibold">Colette</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavDocuments title="管理メニュー" items={data.masterMenu} />

        <NavDocuments title="検索メニュー" items={data.searchMenu} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
