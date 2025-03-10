"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { routeMap } from "@/lib/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarContent>
        <NavMain
          items={routeMap.navMain.map((item) => ({
            ...item,
            isActive: isActiveRoute(item.url) ? true : false,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
