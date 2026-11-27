"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavMainItem = {
  title: string;
  url: string;
  icon?: ReactNode;
};

type NavMainProps = {
  items: NavMainItem[];
  title: string;
  guideTarget?: string;
};

export function NavMain({ items, title, guideTarget }: NavMainProps) {
  const pathname = usePathname();
  const active = (url: string) =>
    url === "/reservations"
      ? pathname.startsWith("/reservations") &&
        pathname !== "/reservations/calendar"
      : pathname === url || pathname.startsWith(`${url}/`);
  return (
    <SidebarGroup data-guide-target={guideTarget}>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active(item.url)}
              >
                <Link
                  href={item.url}
                  aria-current={active(item.url) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
