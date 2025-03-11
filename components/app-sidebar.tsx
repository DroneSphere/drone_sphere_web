"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { routeMap } from "@/lib/route";
// import { LogOut } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
// import { Button } from "./ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "./ui/dropdown-menu";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();


  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarContent>
          <NavMain
            items={routeMap.navMain.map((item) => ({
              ...item,
              isActive: isActiveRoute(item.url) ? true : false,
            }))}
          />
        </SidebarContent>
        <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
      </Sidebar>
    </>
  );
}
