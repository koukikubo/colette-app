"use client";

import * as React from "react";
import Link from "next/link";

import {
  Armchair,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  ChartNoAxesCombinedIcon,
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

import { NavDocuments } from "./navigation/nav-documents";
import { NavMain } from "./navigation/nav-main";
import { NavUser } from "./navigation/nav-user";

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
  ],

  /**
   * 管理メニュー。
   *
   * マスタ系の画面をここにまとめます。
   * 今回の Issue 37 の画面はここに配置します。
   */
  masterMenu: [
    {
      name: "基本コードマスタ",
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
    {
      name: "統一RFマスタ",
      url: "/rf-management",
      icon: <ChartNoAxesCombinedIcon />,
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
        <NavMain title="メインメニュー" items={data.navMain} />
        <NavDocuments title="管理メニュー" items={data.masterMenu} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
