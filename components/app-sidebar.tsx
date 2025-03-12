"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { routeMap } from "@/lib/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarContent>
          <NavMain
            items={routeMap.navMain.map((item) => ({
              ...item,
              url: item.url || "#", // Ensure url is never undefined
              isActive: item.url ? isActiveRoute(item.url) : false,
            }))}
          />
        </SidebarContent>
        <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
      </Sidebar>
    </>
  );
}
