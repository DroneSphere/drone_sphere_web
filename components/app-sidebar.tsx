"use client";

import { Command } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { useUserContext } from "@/contexts/user-context";
import { routeMap } from "@/lib/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();
  const { workspace, isLoading } = useUserContext();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {isLoading ? "加载中..." : workspace?.name || "未知工作区"}
                  </span>
                  <span className="truncate text-xs">
                    {isLoading ? "" : workspace?.type || "未知类型"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={routeMap.navMain.map((item) => ({
            ...item,
            isActive: isActiveRoute(item.url) ? true : false,
          }))}
        />
        <NavSecondary
          items={routeMap.navSecondary.map((item) => ({
            ...item,
            isActive: isActiveRoute(item.url) ? true : false,
          }))}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
