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
import { routeMap } from "@/lib/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();

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
                  <span className="truncate font-semibold">山东大学</span>
                  <span className="truncate text-xs">团队账号</span>
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
        <NavUser user={routeMap.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
