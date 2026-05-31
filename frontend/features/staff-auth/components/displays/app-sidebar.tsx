"use client";

import * as React from "react";

import {
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  SearchIcon,
} from "lucide-react";

import { BsFileEarmarkPerson } from "react-icons/bs";
import { CiBoxList } from "react-icons/ci";
import { MdFormatListBulletedAdd, MdNotes } from "react-icons/md";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "User Name",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "予約一覧",
      url: "#",
      icon: <CiBoxList />,
    },
    {
      title: "顧客管理",
      url: "#",
      icon: <UsersIcon />,
    },
    {
      title: "予約管理",
      url: "#",
      icon: <MdFormatListBulletedAdd />,
    },
    {
      title: "お知らせ",
      url: "#",
      icon: <MdNotes />,
    },
    {
      title: "顧客ノート",
      url: "#",
      icon: <BsFileEarmarkPerson />,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "管理メニュー",
      url: "#",
      icon: <Settings2Icon />,
    },
  ],
  submenu: [
    {
      name: "顧客検索",
      url: "#",
      icon: <SearchIcon />,
    },
    {
      name: "予約検索",
      url: "#",
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
              <a href="#">
                <span className="text-base font-semibold">Colette</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.submenu} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
